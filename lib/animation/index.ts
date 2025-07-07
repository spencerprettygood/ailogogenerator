/**
 * Animation System Main Entry Point
 *
 * This file provides a simplified interface to the animation system.
 * It exports all core types, services, and utilities needed for animating SVGs.
 */

// Export types
export * from './types';

// Export core services
export { SVGAnimationService, svgAnimationService } from './animation-service';
export { AnimationRegistry } from './animation-registry';

// Export providers
export * from './providers';

// Export utilities
export * from './utils';

// Export a pre-configured service instance for convenience
import { SVGAnimationService } from './animation-service';
import { createDefaultProviders } from './providers';

/**
 * Create and initialize a ready-to-use animation service
 *
 * @returns Initialized SVGAnimationService with default providers
 */
export function createAnimationService(): SVGAnimationService {
  const service = new SVGAnimationService();

  // Register default providers
  const providers = createDefaultProviders();
  providers.forEach(provider => service.registerProvider(provider));

  return service;
}

// Create a singleton instance for easy import
const defaultAnimationService = createAnimationService();
export { defaultAnimationService };
