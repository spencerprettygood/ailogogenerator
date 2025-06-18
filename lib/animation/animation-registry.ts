import { AnimationType, AnimationProvider } from './types';

/**
 * Registry for animation providers that can be used to animate SVGs
 * Follows the singleton pattern
 */
export class AnimationRegistry {
  private static instance: AnimationRegistry;
  private providers: AnimationProvider[] = [];
  private defaultProviders: Map<AnimationType, AnimationProvider> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the registry
   * @returns AnimationRegistry instance
   */
  public static getInstance(): AnimationRegistry {
    if (!AnimationRegistry.instance) {
      AnimationRegistry.instance = new AnimationRegistry();
    }
    return AnimationRegistry.instance;
  }

  /**
   * Register an animation provider
   * @param provider The provider to register
   */
  public registerProvider(provider: AnimationProvider): void {
    // Check if provider is already registered
    if (this.providers.some(p => p.id === provider.id)) {
      console.warn(`Provider with id ${provider.id} is already registered`);
      return;
    }
    
    this.providers.push(provider);
    
    // Register as default provider for supported animation types if not already set
    provider.supportedAnimationTypes.forEach(type => {
      if (!this.defaultProviders.has(type)) {
        this.defaultProviders.set(type, provider);
      }
    });
  }

  /**
   * Set a provider as the default for an animation type
   * @param type Animation type
   * @param providerId Provider ID
   */
  public setDefaultProviderForType(type: AnimationType, providerId: string): void {
    const provider = this.providers.find(p => p.id === providerId);
    
    if (!provider) {
      throw new Error(`Provider with id ${providerId} is not registered`);
    }
    
    if (!provider.supportsAnimationType(type)) {
      throw new Error(`Provider with id ${providerId} does not support animation type ${type}`);
    }
    
    this.defaultProviders.set(type, provider);
  }

  /**
   * Get the default provider for an animation type
   * @param type Animation type
   * @returns The default provider for the animation type, or null if none is set
   */
  public getDefaultProviderForType(type: AnimationType): AnimationProvider | null {
    return this.defaultProviders.get(type) || null;
  }

  /**
   * Get all providers that support an animation type
   * @param type Animation type
   * @returns Array of providers that support the animation type
   */
  public getProvidersForType(type: AnimationType): AnimationProvider[] {
    return this.providers.filter(p => p.supportsAnimationType(type));
  }

  /**
   * Get all registered providers
   * @returns Array of all registered providers
   */
  public getAllProviders(): AnimationProvider[] {
    return [...this.providers];
  }

  /**
   * Unregister a provider
   * @param providerId Provider ID
   */
  public unregisterProvider(providerId: string): void {
    const index = this.providers.findIndex(p => p.id === providerId);
    
    if (index === -1) {
      console.warn(`Provider with id ${providerId} is not registered`);
      return;
    }
    
    const provider = this.providers[index];
    this.providers.splice(index, 1);
    
    // Remove as default provider for any animation types
    provider.supportedAnimationTypes.forEach(type => {
      if (this.defaultProviders.get(type)?.id === providerId) {
        this.defaultProviders.delete(type);
      }
    });
  }

  /**
   * Reset the registry (useful for testing)
   */
  public reset(): void {
    this.providers = [];
    this.defaultProviders.clear();
  }
}