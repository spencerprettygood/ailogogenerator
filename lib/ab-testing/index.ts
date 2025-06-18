import { TestManager } from './test-manager';
import { MemoryStorageAdapter } from './storage-adapters/memory-storage';
import { PersistentStorageAdapter } from './storage-adapters/persistent-storage';
import { ConsoleAnalyticsAdapter } from './analytics-adapters/console-analytics';

// Export all types
export * from './types';
export * from './test-manager';

// Export storage adapters
export { MemoryStorageAdapter } from './storage-adapters/memory-storage';
export { PersistentStorageAdapter } from './storage-adapters/persistent-storage';

// Export analytics adapters
export { ConsoleAnalyticsAdapter } from './analytics-adapters/console-analytics';

// Export hooks
export { useAbTest } from './hooks/use-ab-test';

// Default test manager instance
let testManager: TestManager | null = null;

/**
 * Initialize the global test manager
 */
export function initializeTestManager(
  persistentStorage: boolean = false,
  debugMode: boolean = process.env.NODE_ENV === 'development'
): TestManager {
  if (testManager) {
    return testManager;
  }

  const storageAdapter = persistentStorage 
    ? new PersistentStorageAdapter()
    : new MemoryStorageAdapter();
    
  const analyticsAdapter = new ConsoleAnalyticsAdapter(debugMode);
  
  testManager = new TestManager(storageAdapter, analyticsAdapter);
  return testManager;
}

/**
 * Get the global test manager instance
 * Creates one with default settings if it doesn't exist
 */
export function getTestManager(): TestManager {
  if (!testManager) {
    return initializeTestManager();
  }
  return testManager;
}

/**
 * Create a predefined test configuration for experimentation
 */
export function createTestConfig(
  id: string,
  name: string,
  component: string,
  variantsConfig: any,
  trafficSplit: any = { A: 50, B: 50 }
): any {
  return {
    id,
    name,
    description: `A/B test for ${name}`,
    component,
    variants: variantsConfig,
    metrics: ['user_satisfaction', 'generation_speed', 'logo_quality'],
    feedbackSources: ['explicit_rating', 'implicit_behavior'],
    trafficAllocation: trafficSplit,
    startDate: new Date(),
    minimumSampleSize: 30,
    isActive: true
  };
}