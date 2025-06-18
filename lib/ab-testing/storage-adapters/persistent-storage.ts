import { TestConfig, TestSession } from '../types';
import { StorageAdapter } from '../test-manager';
import fs from 'fs/promises';
import path from 'path';

/**
 * Persistent file-based storage adapter for A/B testing
 * Stores test data in JSON files
 */
export class PersistentStorageAdapter implements StorageAdapter {
  private dataDir: string;
  private testsPath: string;
  private sessionsDir: string;

  constructor(dataDir: string = path.join(process.cwd(), 'data', 'ab-testing')) {
    this.dataDir = dataDir;
    this.testsPath = path.join(this.dataDir, 'tests.json');
    this.sessionsDir = path.join(this.dataDir, 'sessions');
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Create base directory
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Create sessions directory
      await fs.mkdir(this.sessionsDir, { recursive: true });
      
      // Initialize tests file if it doesn't exist
      try {
        await fs.access(this.testsPath);
      } catch {
        await fs.writeFile(this.testsPath, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  /**
   * Get all active tests
   */
  public async getActiveTests(): Promise<TestConfig[]> {
    try {
      const data = await fs.readFile(this.testsPath, 'utf-8');
      const tests: TestConfig[] = JSON.parse(data);
      return tests.filter(test => test.isActive);
    } catch (error) {
      console.error('Failed to read tests:', error);
      return [];
    }
  }

  /**
   * Save or update a test configuration
   */
  public async saveTest(test: TestConfig): Promise<void> {
    try {
      const data = await fs.readFile(this.testsPath, 'utf-8');
      const tests: TestConfig[] = JSON.parse(data);
      
      const existingIndex = tests.findIndex(t => t.id === test.id);
      
      if (existingIndex >= 0) {
        tests[existingIndex] = test;
      } else {
        tests.push(test);
      }
      
      await fs.writeFile(this.testsPath, JSON.stringify(tests, null, 2));
    } catch (error) {
      console.error('Failed to save test:', error);
      throw error;
    }
  }

  /**
   * Save a new test session
   */
  public async saveSession(session: TestSession): Promise<void> {
    try {
      const sessionPath = this.getSessionPath(session.sessionId);
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
      
      // Also update the test session index
      await this.updateSessionIndex(session);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Update an existing test session
   */
  public async updateSession(session: TestSession): Promise<void> {
    try {
      const sessionPath = this.getSessionPath(session.sessionId);
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
      
      // Also update the session index
      await this.updateSessionIndex(session);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for a specific test
   */
  public async getSessionsByTest(testId: string): Promise<TestSession[]> {
    try {
      // Get session IDs from the index
      const indexPath = path.join(this.sessionsDir, `test_${testId}_index.json`);
      
      try {
        await fs.access(indexPath);
      } catch {
        // If index doesn't exist, no sessions for this test
        return [];
      }
      
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const sessionIds: string[] = JSON.parse(indexData);
      
      // Load each session
      const sessions: TestSession[] = [];
      for (const sessionId of sessionIds) {
        try {
          const sessionPath = this.getSessionPath(sessionId);
          const sessionData = await fs.readFile(sessionPath, 'utf-8');
          sessions.push(JSON.parse(sessionData));
        } catch (error) {
          console.warn(`Failed to load session ${sessionId}:`, error);
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Failed to get sessions by test:', error);
      return [];
    }
  }

  /**
   * Get the file path for a session
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.sessionsDir, `${sessionId}.json`);
  }

  /**
   * Update the session index for a test
   */
  private async updateSessionIndex(session: TestSession): Promise<void> {
    const indexPath = path.join(this.sessionsDir, `test_${session.testId}_index.json`);
    
    try {
      // Check if index exists
      let sessionIds: string[] = [];
      
      try {
        const indexData = await fs.readFile(indexPath, 'utf-8');
        sessionIds = JSON.parse(indexData);
      } catch {
        // Index doesn't exist yet, create new array
      }
      
      // Add session ID if not already in the index
      if (!sessionIds.includes(session.sessionId)) {
        sessionIds.push(session.sessionId);
        await fs.writeFile(indexPath, JSON.stringify(sessionIds));
      }
    } catch (error) {
      console.error('Failed to update session index:', error);
    }
  }
}