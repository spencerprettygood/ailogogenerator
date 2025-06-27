/**
 * Logo Storage Service
 * Provides local storage for generated logos to prevent loss on refresh
 */

import { GeneratedAssets } from '@/lib/types';

const STORAGE_KEY = 'ai-logo-generator-sessions';
const MAX_STORED_SESSIONS = 10; // Keep last 10 sessions

export interface StoredSession {
  id: string;
  timestamp: number;
  assets: GeneratedAssets;
  prompt: string;
  options: Record<string, any>;
}

export class LogoStorageService {
  /**
   * Save a generated logo session
   */
  static saveSession(sessionId: string, assets: GeneratedAssets, prompt: string, options: Record<string, any>): void {
    try {
      const sessions = this.getAllSessions();
      
      const newSession: StoredSession = {
        id: sessionId,
        timestamp: Date.now(),
        assets,
        prompt,
        options
      };

      // Add new session at the beginning
      sessions.unshift(newSession);

      // Keep only the latest sessions
      const trimmedSessions = sessions.slice(0, MAX_STORED_SESSIONS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSessions));
    } catch (error) {
      console.warn('Failed to save logo session to localStorage:', error);
    }
  }

  /**
   * Get a specific session by ID
   */
  static getSession(sessionId: string): StoredSession | null {
    try {
      const sessions = this.getAllSessions();
      return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
      console.warn('Failed to retrieve logo session from localStorage:', error);
      return null;
    }
  }

  /**
   * Get all stored sessions
   */
  static getAllSessions(): StoredSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to parse stored logo sessions:', error);
      return [];
    }
  }

  /**
   * Get recent sessions (last 5)
   */
  static getRecentSessions(): StoredSession[] {
    return this.getAllSessions().slice(0, 5);
  }

  /**
   * Delete a specific session
   */
  static deleteSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
    } catch (error) {
      console.warn('Failed to delete logo session from localStorage:', error);
    }
  }

  /**
   * Clear all stored sessions
   */
  static clearAllSessions(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear logo sessions from localStorage:', error);
    }
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo(): { sessionCount: number; storageSize: number } {
    try {
      const sessions = this.getAllSessions();
      const data = localStorage.getItem(STORAGE_KEY) || '';
      return {
        sessionCount: sessions.length,
        storageSize: new Blob([data]).size
      };
    } catch (error) {
      return { sessionCount: 0, storageSize: 0 };
    }
  }

  /**
   * Check if localStorage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
