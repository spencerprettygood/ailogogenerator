/**
 * @file app-init.ts
 * @description Application initialization for production readiness
 * 
 * This file handles initializing critical services before the app starts,
 * including environment validation, error reporting, and distributed caching.
 */

import { env } from '@/lib/utils/env';
import { errorReporter } from '@/lib/utils/error-reporter';
import { cacheAdapter } from '@/lib/utils/cache-adapter';

/**
 * Initializes the application for production
 * This runs only once at startup (when imported)
 */
function initApp() {
  try {
    // Validate environment variables
    env.validate();
    
    // Initialize error reporting
    errorReporter.init();
    
    // Test cache adapter connection
    testCacheAdapter().catch(error => {
      console.error('Cache adapter initialization failed:', error);
      
      if (env.isProduction) {
        errorReporter.reportError(
          error instanceof Error ? error : new Error(String(error)),
          { component: 'app-init', additionalInfo: { service: 'cache-adapter' } },
          'warning'
        );
      }
    });
    
    console.log(`Application initialized in ${env.get('NODE_ENV')} mode`);
  } catch (error) {
    console.error('Application initialization failed:', error);
    
    if (env.isProduction) {
      // Try to report the error even if initialization failed
      try {
        errorReporter.reportError(
          error instanceof Error ? error : new Error(String(error)),
          { component: 'app-init' },
          'fatal'
        );
      } catch (reportError) {
        // Last resort - log to console
        console.error('Fatal error during initialization:', error);
        console.error('Error reporting failed:', reportError);
      }
    }
    
    // In production, we might want to throw to prevent startup with invalid config
    if (env.isProduction) {
      throw error;
    }
  }
}

/**
 * Test the cache adapter connection
 */
async function testCacheAdapter() {
  const testKey = 'app-init-test';
  const testItem = {
    key: testKey,
    data: { test: true },
    expiresAt: Date.now() + 10000, // 10 seconds
    createdAt: Date.now(),
    type: 'test',
  };
  
  // Test set operation
  await cacheAdapter.set(testKey, testItem);
  
  // Test get operation
  const retrieved = await cacheAdapter.get(testKey);
  
  if (!retrieved || retrieved.data.test !== true) {
    throw new Error('Cache adapter test failed: data mismatch');
  }
  
  // Clean up
  await cacheAdapter.delete(testKey);
  
  return true;
}

// Run initialization
initApp();

// Export as ESM module for Next.js
export {};