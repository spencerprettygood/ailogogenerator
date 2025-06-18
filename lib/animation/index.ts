/**
 * Animation module exports
 */

// Type exports
export * from './types';

// Animation service
export { SVGAnimationService, animationTemplates } from './animation-service';

// Registry
export { AnimationRegistry } from './animation-registry';

// Providers
export { 
  getBestProviderForType,
  createAllProviders
} from './providers';