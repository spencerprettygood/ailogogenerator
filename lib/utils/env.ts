/**
 * @file env.ts
 * @description Environment variable validation and configuration
 * 
 * This file handles environment variable validation and provides
 * type-safe access to environment variables across the application.
 */

type EnvVariable = {
  value: string | undefined;
  required: boolean;
  validate?: (value: string) => boolean;
  errorMessage?: string;
};

/**
 * Configuration for all environment variables used in the application
 */
const envConfig: Record<string, EnvVariable> = {
  // Authentication
  ADMIN_USERNAME: {
    value: process.env.ADMIN_USERNAME,
    required: true,
    validate: (value) => value.length >= 8,
    errorMessage: 'ADMIN_USERNAME must be at least 8 characters long',
  },
  ADMIN_PASSWORD: {
    value: process.env.ADMIN_PASSWORD,
    required: true,
    validate: (value) => value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value),
    errorMessage: 'ADMIN_PASSWORD must be at least 12 characters with uppercase, number, and special character',
  },
  
  // API Keys
  CLAUDE_API_KEY: {
    value: process.env.CLAUDE_API_KEY,
    required: true,
    validate: (value) => value.length > 20,
    errorMessage: 'CLAUDE_API_KEY is invalid',
  },
  
  // App Configuration
  NODE_ENV: {
    value: process.env.NODE_ENV,
    required: true,
    validate: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be development, production, or test',
  },
  
  // Optional but validated if present
  RATE_LIMIT_MAX: {
    value: process.env.RATE_LIMIT_MAX,
    required: false,
    validate: (value) => !isNaN(Number(value)) && Number(value) > 0,
    errorMessage: 'RATE_LIMIT_MAX must be a positive number',
  },
  
  // Optional with no validation
  DEPLOYMENT_ENV: {
    value: process.env.DEPLOYMENT_ENV,
    required: false,
  },
};

/**
 * Validates all required environment variables
 * Throws an error if any required variables are missing or invalid
 */
export function validateEnv(): void {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];
  
  Object.entries(envConfig).forEach(([key, config]) => {
    // Check if required and missing
    if (config.required && (!config.value || config.value.trim() === '')) {
      missingVars.push(key);
      return;
    }
    
    // If has a value and validation function, validate it
    if (config.value && config.validate && !config.validate(config.value)) {
      invalidVars.push(`${key}: ${config.errorMessage || 'Invalid value'}`);
    }
  });
  
  // Report all issues at once
  if (missingVars.length > 0 || invalidVars.length > 0) {
    let errorMessage = 'Environment validation failed:';
    
    if (missingVars.length > 0) {
      errorMessage += `\nMissing required variables: ${missingVars.join(', ')}`;
    }
    
    if (invalidVars.length > 0) {
      errorMessage += `\nInvalid variables:\n${invalidVars.join('\n')}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Gets a type-safe environment variable
 * @param key The environment variable name
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value or default
 */
export function getEnv(key: string, defaultValue?: string): string {
  const config = envConfig[key];
  
  if (!config) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not configured`);
  }
  
  return config.value || defaultValue || '';
}

/**
 * Gets a number environment variable
 * @param key The environment variable name
 * @param defaultValue Optional default value if not found
 * @returns The environment variable as a number
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = getEnv(key, defaultValue?.toString());
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
export function getEnvBool(key: string, defaultValue = false): boolean {
  const value = getEnv(key, defaultValue ? 'true' : 'false').toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

// Export default object for convenience
export const env = {
  get: getEnv,
  getNumber: getEnvNumber,
  getBool: getEnvBool,
  validate: validateEnv,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

export default env;