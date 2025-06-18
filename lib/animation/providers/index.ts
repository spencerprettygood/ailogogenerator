/**
 * Animation Providers Index
 * 
 * This file exports all animation providers and related utilities.
 * It provides a central entry point for accessing different animation technologies.
 */

import { AnimationProvider, AnimationType } from '../types';
import { CSSAnimationProvider } from './css-provider';

/**
 * Export providers
 */
export { CSSAnimationProvider };

/**
 * Get the best provider for a given animation type and browser environment
 * 
 * @param type - The animation type
 * @param providers - Array of available providers
 * @returns The best provider for the animation type, or undefined if none found
 */
export function getBestProviderForType(
  type: AnimationType,
  providers: AnimationProvider[]
): AnimationProvider | undefined {
  // Filter providers that support this animation type
  const supportingProviders = providers.filter(provider => 
    provider.supportsAnimationType(type)
  );
  
  if (supportingProviders.length === 0) {
    return undefined;
  }
  
  // For now, prioritize providers in a simple order: CSS, SMIL, JS
  // This will be expanded with more sophisticated browser capability detection
  
  // Path-based animations work better with SMIL
  if (type === AnimationType.DRAW || type === AnimationType.MORPH) {
    const smilProvider = supportingProviders.find(p => p.id === 'smil');
    if (smilProvider) return smilProvider;
  }
  
  // Complex animations work better with JS
  if (type === AnimationType.TYPEWRITER || type === AnimationType.CUSTOM) {
    const jsProvider = supportingProviders.find(p => p.id === 'js');
    if (jsProvider) return jsProvider;
  }
  
  // Most animations work well with CSS and it has the best browser support
  const cssProvider = supportingProviders.find(p => p.id === 'css');
  if (cssProvider) return cssProvider;
  
  // Default to first available provider
  return supportingProviders[0];
}

/**
 * Create all default animation providers
 * 
 * @returns Array of initialized default providers
 */
export function createDefaultProviders(): AnimationProvider[] {
  return [
    new CSSAnimationProvider(),
    // Add more providers as they're implemented
  ];
}