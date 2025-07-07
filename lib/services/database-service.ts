import { db } from '../db/connection';
import { LogoBrief, GenerationResult } from '../types';

export interface User {
  id: string;
  email?: string;
  created_at: Date;
  last_active: Date;
}

export interface Session {
  id: string;
  user_id?: string;
  session_token: string;
  expires_at: Date;
  created_at: Date;
}

export interface LogoGeneration {
  id: string;
  user_id?: string;
  session_id?: string;
  brief: string;
  design_spec?: any;
  final_svg?: string;
  variants?: any;
  guidelines_url?: string;
  package_url?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
}

export interface UserFeedback {
  id: string;
  generation_id: string;
  type: 'logo' | 'issue' | 'suggestion';
  rating?: number;
  feedback_text?: string;
  created_at: Date;
}

/**
 * Database service for managing logo generation data
 */
export class DatabaseService {
  // User Management
  async createUser(email?: string): Promise<User> {
    const [user] = await db.query<User>(`INSERT INTO users (email) VALUES ($1) RETURNING *`, [
      email,
    ]);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return await db.queryOne<User>(`SELECT * FROM users WHERE id = $1`, [id]);
  }

  async updateUserActivity(id: string): Promise<void> {
    await db.query(`UPDATE users SET last_active = NOW() WHERE id = $1`, [id]);
  }

  // Session Management
  async createSession(userId?: string): Promise<Session> {
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [session] = await db.query<Session>(
      `INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING *`,
      [userId, sessionToken, expiresAt]
    );
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    return await db.queryOne<Session>(
      `SELECT * FROM sessions WHERE session_token = $1 AND expires_at > NOW()`,
      [token]
    );
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.query(`DELETE FROM sessions WHERE expires_at < NOW()`);
  }

  // Logo Generation Management
  async createLogoGeneration(data: {
    userId?: string;
    sessionId?: string;
    brief: string;
    designSpec?: any;
  }): Promise<LogoGeneration> {
    const [generation] = await db.query<LogoGeneration>(
      `INSERT INTO logo_generations (user_id, session_id, brief, design_spec) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.userId, data.sessionId, data.brief, JSON.stringify(data.designSpec)]
    );
    if (!generation) {
      throw new Error('Failed to create logo generation');
    }
    return generation;
  }

  async updateLogoGeneration(
    id: string,
    data: {
      finalSvg?: string;
      variants?: any;
      guidelinesUrl?: string;
      packageUrl?: string;
      status?: LogoGeneration['status'];
    }
  ): Promise<LogoGeneration | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.finalSvg !== undefined) {
      updates.push(`final_svg = $${paramIndex++}`);
      values.push(data.finalSvg);
    }

    if (data.variants !== undefined) {
      updates.push(`variants = $${paramIndex++}`);
      values.push(JSON.stringify(data.variants));
    }

    if (data.guidelinesUrl !== undefined) {
      updates.push(`guidelines_url = $${paramIndex++}`);
      values.push(data.guidelinesUrl);
    }

    if (data.packageUrl !== undefined) {
      updates.push(`package_url = $${paramIndex++}`);
      values.push(data.packageUrl);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);

      if (data.status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (updates.length === 0) return null;

    values.push(id);

    return await db.queryOne<LogoGeneration>(
      `UPDATE logo_generations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  }

  async getLogoGenerationById(id: string): Promise<LogoGeneration | null> {
    return await db.queryOne<LogoGeneration>(`SELECT * FROM logo_generations WHERE id = $1`, [id]);
  }

  async getLogoGenerationsByUser(userId: string, limit = 10): Promise<LogoGeneration[]> {
    return await db.query<LogoGeneration>(
      `SELECT * FROM logo_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
  }

  // Feedback Management
  async createFeedback(data: {
    generationId: string;
    type: UserFeedback['type'];
    rating?: number;
    feedbackText?: string;
  }): Promise<UserFeedback> {
    const [feedback] = await db.query<UserFeedback>(
      `INSERT INTO user_feedback (generation_id, type, rating, feedback_text) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.generationId, data.type, data.rating, data.feedbackText]
    );
    if (!feedback) {
      throw new Error('Failed to create feedback');
    }
    return feedback;
  }

  async getFeedbackByGeneration(generationId: string): Promise<UserFeedback[]> {
    return await db.query<UserFeedback>(
      `SELECT * FROM user_feedback WHERE generation_id = $1 ORDER BY created_at DESC`,
      [generationId]
    );
  }

  // System Metrics
  async recordMetric(name: string, value: number, tags?: Record<string, any>): Promise<void> {
    await db.query(
      `INSERT INTO system_metrics (metric_name, metric_value, tags) VALUES ($1, $2, $3)`,
      [name, value, JSON.stringify(tags)]
    );
  }

  async getMetrics(
    name: string,
    since?: Date,
    limit = 100
  ): Promise<
    Array<{
      metric_name: string;
      metric_value: number;
      tags: any;
      timestamp: Date;
    }>
  > {
    const whereClause = since
      ? 'WHERE metric_name = $1 AND timestamp > $2'
      : 'WHERE metric_name = $1';
    const params = since ? [name, since] : [name];

    return await db.query(
      `SELECT * FROM system_metrics ${whereClause} ORDER BY timestamp DESC LIMIT $${params.length + 1}`,
      [...params, limit]
    );
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
