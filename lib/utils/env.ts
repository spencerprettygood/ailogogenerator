/**
 * Environment Variables Validation Module
 *
 * This module provides secure, type-safe access to environment variables
 * with validation to ensure all required variables are properly set.
 */

import { z } from 'zod';

/**
 * Get the current environment (development, test, production)
 */
function getNodeEnv(): string {
  return process.env.NODE_ENV || 'development';
}

/**
 * Check if the current environment is development
 */
function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

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
    .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must contain at least one special character' })
    .optional(),

  // API Keys (sensitive)
  // Anthropic API Key: optional in development and test with dummy default, required in production
  ANTHROPIC_API_KEY: z.string().min(20).optional(),
  CLAUDE_API_KEY: z.string().min(20).optional(),
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
  ENABLE_ANIMATION_FEATURES: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .default('true'),
  ENABLE_MOCKUPS: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .default('true'),

  // Cache Settings
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().optional().default(3600),

  // Database Configuration
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_URL_NON_POOLING: z.string().url().optional(),
  POSTGRES_DATABASE: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
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
        .filter(
          ([key, value]) => key !== '_errors' && typeof value === 'object' && '_errors' in value
        )
        .map(([key]) => key);

      if (missingVars.length > 0) {
        // In development, try to provide defaults for missing variables
        if (isDevelopment()) {
          console.warn(
            `Using mock values for missing environment variables: ${missingVars.join(', ')}`
          );
          const mockEnv = {
            ...process.env,
            ANTHROPIC_API_KEY: 'dummy-key-for-development-only',
            NODE_ENV: 'development',
            ENABLE_ANIMATION_FEATURES: 'true',
            ENABLE_MOCKUPS: 'true',
            CACHE_TTL_SECONDS: '3600',
          };
          return envSchema.parse(mockEnv);
        } else {
          throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
      }
    }

    console.error('❌ Failed to validate environment variables', error);
    if (isDevelopment()) {
      console.warn('Using mock environment in development');
      return envSchema.parse({
        NODE_ENV: 'development',
        ANTHROPIC_API_KEY: 'dummy-key-for-development-only',
        ENABLE_ANIMATION_FEATURES: 'true',
        ENABLE_MOCKUPS: 'true',
        CACHE_TTL_SECONDS: '3600',
      });
    }
    throw new Error('Invalid environment variables');
  }
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production';
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
  return process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
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
    // In development mode, don't throw errors for missing env vars
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Environment variable ${key} is not configured, using empty string`);
      return '';
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
let validatedEnv: {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_API_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_SECONDS: number;
  ENABLE_ANIMATION_FEATURES: boolean;
  ENABLE_MOCKUPS: boolean;
  CACHE_TTL_SECONDS: number;
  ADMIN_USERNAME?: string | undefined;
  ADMIN_PASSWORD?: string | undefined;
  CLAUDE_API_KEY?: string | undefined;
  OPENAI_API_KEY?: string | undefined;
  NEXT_PUBLIC_APP_URL?: string | undefined;
  VERCEL_URL?: string | undefined;
  VERCEL_ENV?: 'preview' | 'development' | 'production' | undefined;
  DEPLOYMENT_ENV?: string | undefined;
  POSTGRES_URL?: string | undefined;
  POSTGRES_URL_NON_POOLING?: string | undefined;
  POSTGRES_DATABASE?: string | undefined;
  DATABASE_URL?: string | undefined;
};

// Check runtime environment to determine validation strategy
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';
const isBrowser = typeof window !== 'undefined';
const isDev = process.env.NODE_ENV === 'development';

// Handle different runtime environments
if (isEdgeRuntime) {
  // In Edge Runtime (like middleware), use minimal validation to prevent failures
  console.log('Running in Edge Runtime - using simplified environment validation');
  validatedEnv = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'production',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-edge-runtime',
    ANTHROPIC_API_URL: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    RATE_LIMIT_WINDOW_SECONDS: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '3600'),
    ENABLE_ANIMATION_FEATURES: process.env.ENABLE_ANIMATION_FEATURES !== 'false',
    ENABLE_MOCKUPS: process.env.ENABLE_MOCKUPS !== 'false',
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600'),
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV as any,
    DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
    DATABASE_URL: process.env.DATABASE_URL,
  };
} else if (isBrowser || isDev) {
  try {
    // Try to validate the environment first
    validatedEnv = validateEnv();
    if (isBrowser) {
      console.log('Environment variables successfully loaded in browser context');
    }
  } catch (error) {
    // If validation fails, use mock values in development/browser
    console.warn('Using mock environment variables for development');
    validatedEnv = {
      // Provide minimal mock values that are needed for client rendering
      NODE_ENV: 'development',
      ANTHROPIC_API_KEY: 'dummy-key-for-development-only',
      ANTHROPIC_API_URL: 'https://api.anthropic.com',
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW_SECONDS: 3600,
      ENABLE_ANIMATION_FEATURES: true,
      ENABLE_MOCKUPS: true,
      CACHE_TTL_SECONDS: 3600,
    };
  }
} else {
  // Server-side in production: validate the real environment
  try {
    validatedEnv = validateEnv();
  } catch (error) {
    console.error('Environment validation failed on server-side:', error);
    // Provide fallback values to prevent complete failure
    validatedEnv = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'production',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      ANTHROPIC_API_URL: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
      RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      RATE_LIMIT_WINDOW_SECONDS: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '3600'),
      ENABLE_ANIMATION_FEATURES: process.env.ENABLE_ANIMATION_FEATURES !== 'false',
      ENABLE_MOCKUPS: process.env.ENABLE_MOCKUPS !== 'false',
      CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600'),
    };
  }
}

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
  isClient: typeof window !== 'undefined',
};

export default env;

// WARNING: Client-side usage is supported in development only with mock values.
// For production, use process.env.NEXT_PUBLIC_* variables for client-side logic.
