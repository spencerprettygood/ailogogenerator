/**
 * Environment Variables Validation Module
 * 
 * This module provides secure, type-safe access to environment variables
 * with validation to ensure all required variables are properly set.
 */

import { z } from 'zod';
import "server-only";

/**
 * Schema for validating environment variables
 * This ensures all required variables are present and correctly formatted
 */
const envSchema = z.object({
  // Authentication
  ADMIN_USERNAME: z.string().min(8).optional(),
  ADMIN_PASSWORD: z
    .string()
    .min(12)
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character" })
    .optional(),
  
  // API Keys (sensitive)
  CLAUDE_API_KEY: z.string().min(20).optional(),
  ANTHROPIC_API_KEY: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20).optional(),
  
  // API URLs
  ANTHROPIC_API_URL: z.string().url().optional().default('https://api.anthropic.com'),
  
  // Next.js Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  
  // Deployment Settings
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  DEPLOYMENT_ENV: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().optional().default(100),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().optional().default(3600),
  
  // Feature Flags
  ENABLE_ANIMATION_FEATURES: z.enum(['true', 'false']).transform(val => val === 'true').optional().default('true'),
  ENABLE_MOCKUPS: z.enum(['true', 'false']).transform(val => val === 'true').optional().default('true'),
  
  // Cache Settings
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().optional().default(3600),
});

/**
 * Type definition for the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Enhanced environment interface with additional helper methods
 */
export interface EnvWithHelpers extends Env {
  // Helper methods
  get: (key: keyof Env, defaultValue?: string) => string;
  getNumber: (key: keyof Env, defaultValue?: number) => number;
  getBool: (key: keyof Env, defaultValue?: boolean) => boolean;
  
  // Environment indicator flags
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  isClient: boolean;
}

/**
 * Validate all environment variables against the schema
 * @returns Validated and typed environment variables
 * @throws Error if validation fails
 */
export function validateEnv(): Env {
  try {
    // Parse and validate environment variables
    return envSchema.parse(process.env);
  } catch (error) {
    // Format validation errors for better debugging
    if (error instanceof z.ZodError) {
      const formattedError = error.format();
      console.error('❌ Invalid environment variables:', JSON.stringify(formattedError, null, 2));
      
      // Identify missing required variables
      const missingVars = Object.entries(formattedError)
        .filter(([key, value]) => key !== '_errors' && typeof value === 'object' && '_errors' in value)
        .map(([key]) => key);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
    }
    
    console.error('❌ Failed to validate environment variables', error);
    throw new Error('Invalid environment variables');
  }
}

/**
 * Get the current environment (development, test, production)
 */
export function getNodeEnv(): string {
  return process.env.NODE_ENV || 'development';
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

/**
 * Check if the current environment is development
 */
export function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

/**
 * Check if the current environment is test
 */
export function isTest(): boolean {
  return getNodeEnv() === 'test';
}

/**
 * Get the base URL for the application
 * Uses NEXT_PUBLIC_APP_URL or constructs from VERCEL_URL if available
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // On Vercel, use the automatically provided URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback for local development
  return 'http://localhost:3000';
}

/**
 * Gets a type-safe environment variable
 * @param key The environment variable name
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value or default
 */
export function getEnv(key: keyof Env, defaultValue?: string): string {
  const value = validatedEnv[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not configured`);
  }
  
  return String(value);
}

/**
 * Gets a number environment variable
 * @param key The environment variable name
 * @param defaultValue Optional default value if not found
 * @returns The environment variable as a number
 */
export function getEnvNumber(key: keyof Env, defaultValue?: number): number {
  const value = validatedEnv[key];
  
  if (value === undefined) {
    return defaultValue || 0;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return defaultValue || 0;
  }
  
  return num;
}

/**
 * Gets a boolean environment variable
 * @param key The environment variable name
 * @param defaultValue Optional default value if not found
 * @returns The environment variable as a boolean
 */
export function getEnvBool(key: keyof Env, defaultValue = false): boolean {
  const value = validatedEnv[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  const strValue = String(value).toLowerCase();
  return strValue === 'true' || strValue === '1' || strValue === 'yes';
}

// Basic validated environment variables
const validatedEnv = validateEnv();

/**
 * Type-safe, validated environment variables with helper methods
 * This should be used instead of directly accessing process.env
 */
export const env: EnvWithHelpers = {
  ...validatedEnv,
  
  // Helper methods
  get: getEnv,
  getNumber: getEnvNumber,
  getBool: getEnvBool,
  
  // Environment indicator flags
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
  isTest: isTest(),
  isClient: typeof window !== 'undefined'
};

export default env;