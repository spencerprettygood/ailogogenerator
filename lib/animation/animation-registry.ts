/**
 * Animation Registry
 * 
 * This module provides a centralized registry for animation providers.
 * It implements the singleton pattern to ensure a single registry instance
 * is used throughout the application.
 * 
 * The registry is responsible for:
 * - Registering animation providers
 * - Retrieving providers by ID or animation type
 * - Managing the lifecycle of providers
 */

import { AnimationProvider, AnimationType } from './types';

/**
 * Animation Registry for managing animation providers
 */
export class AnimationRegistry {
  private static instance: AnimationRegistry;
  private providers: Map<string, AnimationProvider> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize registry
  }
  
  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): AnimationRegistry {
    if (!AnimationRegistry.instance) {
      AnimationRegistry.instance = new AnimationRegistry();
    }
    return AnimationRegistry.instance;
  }
  
  /**
   * Register a new animation provider
   * 
   * @param provider - The animation provider to register
   * @throws Error if a provider with the same ID is already registered
   */
  public registerProvider(provider: AnimationProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider with ID '${provider.id}' is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }
  
  /**
   * Unregister an animation provider
   * 
   * @param providerId - The ID of the provider to unregister
   * @returns true if the provider was found and unregistered, false otherwise
   */
  public unregisterProvider(providerId: string): boolean {
    return this.providers.delete(providerId);
  }
  
  /**
   * Get an animation provider by ID
   * 
   * @param providerId - The ID of the provider to retrieve
   * @returns The animation provider or undefined if not found
   */
  public getProviderById(providerId: string): AnimationProvider | undefined {
    return this.providers.get(providerId);
  }
  
  /**
   * Get all registered animation providers
   * 
   * @returns Array of all registered providers
   */
  public getAllProviders(): AnimationProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Find a provider that supports the given animation type
   * 
   * @param animationType - The animation type to find a provider for
   * @returns The first provider that supports the animation type, or undefined if none found
   */
  public getProviderForType(animationType: AnimationType): AnimationProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.supportsAnimationType(animationType)) {
        return provider;
      }
    }
    return undefined;
  }
  
  /**
   * Find the best provider for the given animation type based on browser capabilities
   * 
   * @param animationType - The animation type to find a provider for
   * @returns The most suitable provider for the animation type, or undefined if none found
   */
  public getBestProviderForType(animationType: AnimationType): AnimationProvider | undefined {
    const supportingProviders = Array.from(this.providers.values())
      .filter(provider => provider.supportsAnimationType(animationType));
    
    if (supportingProviders.length === 0) {
      return undefined;
    }
    
    // Prioritize providers based on animation type
    // This can be extended with more sophisticated logic
    switch (animationType) {
      case AnimationType.DRAW:
      case AnimationType.MORPH:
        // SMIL is better for path-based animations
        const smilProvider = supportingProviders.find(p => p.id === 'smil');
        return smilProvider || supportingProviders[0];
        
      case AnimationType.SEQUENTIAL:
      case AnimationType.TYPEWRITER:
      case AnimationType.CUSTOM:
        // JS is better for complex animations
        const jsProvider = supportingProviders.find(p => p.id === 'js');
        return jsProvider || supportingProviders[0];
        
      default:
        // CSS is better for basic animations (fade, zoom, etc.)
        const cssProvider = supportingProviders.find(p => p.id === 'css');
        return cssProvider || supportingProviders[0];
    }
  }
  
  /**
   * Clear all registered providers
   */
  public clearProviders(): void {
    this.providers.clear();
  }
  
  /**
   * Check if a provider is registered
   * 
   * @param providerId - The ID of the provider to check
   * @returns true if the provider is registered, false otherwise
   */
  public hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }
  
  /**
   * Get the number of registered providers
   * 
   * @returns The number of registered providers
   */
  public getProviderCount(): number {
    return this.providers.size;
  }
}