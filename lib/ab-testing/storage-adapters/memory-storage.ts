import { TestConfig, TestSession } from '../types';
import { StorageAdapter } from '../test-manager';

/**
 * In-memory storage adapter for A/B testing
 * For development and testing purposes only
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private tests: TestConfig[] = [];
  private sessions: TestSession[] = [];

  /**
   * Get all active tests
   */
  public async getActiveTests(): Promise<TestConfig[]> {
    return this.tests.filter(test => test.isActive);
  }

  /**
   * Save or update a test configuration
   */
  public async saveTest(test: TestConfig): Promise<void> {
    const existingIndex = this.tests.findIndex(t => t.id === test.id);

    if (existingIndex >= 0) {
      this.tests[existingIndex] = test;
    } else {
      this.tests.push(test);
    }
  }

  /**
   * Save a new test session
   */
  public async saveSession(session: TestSession): Promise<void> {
    this.sessions.push(session);
  }

  /**
   * Update an existing test session
   */
  public async updateSession(session: TestSession): Promise<void> {
    const index = this.sessions.findIndex(s => s.sessionId === session.sessionId);

    if (index >= 0) {
      this.sessions[index] = session;
    } else {
      // If session doesn't exist, add it
      await this.saveSession(session);
    }
  }

  /**
   * Get all sessions for a specific test
   */
  public async getSessionsByTest(testId: string): Promise<TestSession[]> {
    return this.sessions.filter(session => session.testId === testId);
  }

  /**
   * Clear all data (for testing)
   */
  public async clear(): Promise<void> {
    this.tests = [];
    this.sessions = [];
  }
}
