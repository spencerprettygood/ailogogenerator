/**
 * Simple logger utility for personal use
 * Replaces console.log statements with a more controlled approach
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// For production, we'll just use simpler methods
export const log = logger.log;
export const logInfo = logger.info;
export const logWarn = logger.warn;
export const logError = logger.error;
export const logDebug = logger.debug;

// Export Logger class for compatibility
export class Logger {
  private name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  log(...args: any[]) {
    logger.log(`[${this.name}]`, ...args);
  }
  
  info(...args: any[]) {
    logger.info(`[${this.name}]`, ...args);
  }
  
  warn(...args: any[]) {
    logger.warn(`[${this.name}]`, ...args);
  }
  
  error(...args: any[]) {
    logger.error(`[${this.name}]`, ...args);
  }
  
  debug(...args: any[]) {
    logger.debug(`[${this.name}]`, ...args);
  }
}