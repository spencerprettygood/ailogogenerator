/**
 * Logger Utility
 * 
 * A comprehensive logging system for the AI Logo Generator that provides:
 * - Structured logging with context and metadata
 * - Multiple log levels (debug, info, warn, error)
 * - Optional integration with external logging services
 * - Contextual logging with module/component names
 * - Browser and server compatibility
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableMetadata: boolean;
  enableTimestamps: boolean;
  enableStackTraces: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableMetadata: true,
  enableTimestamps: true,
  enableStackTraces: true
};

/**
 * Global logger configuration that applies to all logger instances
 */
let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Logger class for structured, contextual logging
 */
export class Logger {
  private module: string;
  private config: LoggerConfig;

  /**
   * Create a new logger instance
   * 
   * @param module - The module or component name for contextual logging
   * @param config - Optional configuration overrides for this logger instance
   */
  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.config = { ...globalConfig, ...config };
  }

  /**
   * Configure global logger settings
   * 
   * @param config - Configuration options to apply globally
   */
  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  }

  /**
   * Log a debug message
   * 
   * @param message - The message to log
   * @param metadata - Optional contextual data
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an informational message
   * 
   * @param message - The message to log
   * @param metadata - Optional contextual data
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a warning message
   * 
   * @param message - The message to log
   * @param metadata - Optional contextual data
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an error message
   * 
   * @param message - The message to log
   * @param metadata - Optional contextual data
   * @param error - Optional error object
   */
  error(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    const metadataWithError = { ...metadata };
    if (error && !metadataWithError.error) {
      metadataWithError.error = error.message;
      if (this.config.enableStackTraces && error.stack) {
        metadataWithError.stack = error.stack;
      }
    }
    this.log(LogLevel.ERROR, message, metadataWithError);
  }

  /**
   * Internal method to handle logging
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param metadata - Optional contextual data
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    // Skip logging if below minimum level
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.config.enableTimestamps ? new Date().toISOString() : '',
      level,
      message,
      module: this.module,
      metadata: this.config.enableMetadata ? metadata : undefined
    };

    // Send to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Here we could add additional log destinations (e.g., external services)
    // this.logToExternalService(entry);
  }

  /**
   * Log to the console with appropriate formatting
   * 
   * @param entry - The log entry to output
   */
  private logToConsole(entry: LogEntry): void {
    const levelLabels = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR'
    };

    const timestamp = entry.timestamp ? `[${entry.timestamp}] ` : '';
    const level = levelLabels[entry.level];
    const module = entry.module ? `[${entry.module}] ` : '';
    const prefix = `${timestamp}${level} ${module}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix}${entry.message}`, entry.metadata || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix}${entry.message}`, entry.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix}${entry.message}`, entry.metadata || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix}${entry.message}`, entry.metadata || '');
        break;
    }
  }

  /**
   * Create a child logger with a sub-module name
   * 
   * @param subModule - The name of the sub-module
   * @returns A new logger instance with the combined module name
   */
  createChildLogger(subModule: string): Logger {
    return new Logger(`${this.module}:${subModule}`, this.config);
  }
}

// Create root logger for direct use
export const logger = new Logger('App');