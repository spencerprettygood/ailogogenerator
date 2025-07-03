import { sql } from '@vercel/postgres';
import { env } from '../utils/env';

/**
 * Database connection utility using Vercel Postgres
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  
  private constructor() {}
  
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  /**
   * Execute a SQL query with parameters
   */
  async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await sql.query(text, params);
      return result.rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
  
  /**
   * Execute a SQL query and return the first row
   */
  async queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] || null;
  }
  
  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (sql: typeof import('@vercel/postgres').sql) => Promise<T>): Promise<T> {
    return await callback(sql);
  }
  
  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();
