/**
 * @file env.ts
 * @description Environment variable handling with validation
 * 
 * This module handles environment variable access with proper validation and error checking.
 * It provides type-safe access to environment variables and ensures all required variables
 * are present before the application starts.
 */

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Environment variable schema
interface EnvVariables {
  // API Keys (required)
  ANTHROPIC_API_KEY?: string;
  
  // API Keys (optional)
  OPENAI_API_KEY?: string;
  TAVILY_API_KEY?: string;
  
  // Payment processing (optional)
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  
  // App configuration
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV?: 'development' | 'production' | 'test';
  
  // Feature flags
  ENABLE_CACHING?: string;
  ENABLE_ANALYTICS?: string;
  
  // Performance settings
  RATE_LIMIT_MAX?: string;
  RATE_LIMIT_WINDOW?: string;
}

// Get a required environment variable (only on server)
function getRequiredEnv(key: string): string {
  // Skip validation on client side
  if (isClient) {
    return '';
  }
  
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Get an optional environment variable
function getOptionalEnv(key: string, defaultValue: string = ''): string {
  // On client side, return default value
  if (isClient) {
    return defaultValue;
  }
  
  return process.env[key] || defaultValue;
}

// Get boolean environment variable
function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
  // On client side, return default value
  if (isClient) {
    return defaultValue;
  }
  
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Get numeric environment variable
function getNumericEnv(key: string, defaultValue: number): number {
  // On client side, return default value
  if (isClient) {
    return defaultValue;
  }
  
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Parse environment with validation
export const env: EnvVariables = {
  // On client-side, provide empty values to avoid errors
  ...(isClient ? {} : {
    // API Keys (server-side only)
    ANTHROPIC_API_KEY: getRequiredEnv('ANTHROPIC_API_KEY'),
    OPENAI_API_KEY: getOptionalEnv('OPENAI_API_KEY'),
    TAVILY_API_KEY: getOptionalEnv('TAVILY_API_KEY'),
    STRIPE_SECRET_KEY: getOptionalEnv('STRIPE_SECRET_KEY'),
  }),
  
  // Public values available on both client and server
  STRIPE_PUBLISHABLE_KEY: getOptionalEnv('STRIPE_PUBLISHABLE_KEY'),
  NEXT_PUBLIC_APP_URL: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV: (getOptionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  
  // Feature flags
  ENABLE_CACHING: getOptionalEnv('ENABLE_CACHING', 'true'),
  ENABLE_ANALYTICS: getOptionalEnv('ENABLE_ANALYTICS', 'false'),
  
  // Performance settings
  RATE_LIMIT_MAX: getOptionalEnv('RATE_LIMIT_MAX', '10'),
  RATE_LIMIT_WINDOW: getOptionalEnv('RATE_LIMIT_WINDOW', '900000'),
};

// Export helper functions for use across the app
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  appUrl: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  features: {
    cachingEnabled: getBooleanEnv('ENABLE_CACHING', true),
    analyticsEnabled: getBooleanEnv('ENABLE_ANALYTICS', false),
  },
  rate: {
    maxRequests: getNumericEnv('RATE_LIMIT_MAX', 10),
    windowMs: getNumericEnv('RATE_LIMIT_WINDOW', 900000),
  },
  isClient, // Export flag for client-side checks
};

// Function to validate all required environment variables (server-side only)
export function validateEnv(): boolean {
  // Skip validation on client side
  if (isClient) {
    return true;
  }
  
  try {
    // Check for required API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('Missing environment variable: ANTHROPIC_API_KEY');
    }
    
    // Check for valid URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.startsWith('http')) {
      console.warn('NEXT_PUBLIC_APP_URL should be a valid URL starting with http:// or https://');
    }
    
    // Check for valid NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
      console.warn('NODE_ENV should be one of: development, production, test');
    }
    
    return true;
  } catch (error) {
    console.error('Environment validation failed:', error);
    return false;
  }
}

// Export default config
export default { env, config };