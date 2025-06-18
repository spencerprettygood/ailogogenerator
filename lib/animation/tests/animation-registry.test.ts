import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnimationRegistry } from '../animation-registry';
import { AnimationProvider, AnimationType } from '../types';

// Mock animation provider for testing
class MockAnimationProvider implements AnimationProvider {
  id: string = 'mock-provider';
  name: string = 'Mock Provider';
  description: string = 'A mock provider for testing';
  supportedAnimationTypes: AnimationType[] = [
    AnimationType.FADE_IN,
    AnimationType.ZOOM_IN
  ];
  
  supportsAnimationType(type: AnimationType): boolean {
    return this.supportedAnimationTypes.includes(type);
  }
  
  async animate(svg: string, options: any): Promise<any> {
    return {
      originalSvg: svg,
      animatedSvg: svg, // Mock implementation just returns the original
      animationOptions: options
    };
  }
}

describe('AnimationRegistry', () => {
  let registry: AnimationRegistry;
  let mockProvider: AnimationProvider;
  
  beforeEach(() => {
    // Reset the registry before each test
    registry = AnimationRegistry.getInstance();
    registry.clearProviders();
    
    // Create a fresh mock provider
    mockProvider = new MockAnimationProvider();
  });
  
  it('should be a singleton', () => {
    const instance1 = AnimationRegistry.getInstance();
    const instance2 = AnimationRegistry.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should register a provider', () => {
    registry.registerProvider(mockProvider);
    const retrievedProvider = registry.getProvider(mockProvider.id);
    expect(retrievedProvider).toBe(mockProvider);
  });
  
  it('should get all registered providers', () => {
    registry.registerProvider(mockProvider);
    const providers = registry.getAllProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0]).toBe(mockProvider);
  });
  
  it('should get providers by animation type', () => {
    registry.registerProvider(mockProvider);
    
    // Should find the provider for supported types
    const fadeInProviders = registry.getProvidersByAnimationType(AnimationType.FADE_IN);
    expect(fadeInProviders).toHaveLength(1);
    expect(fadeInProviders[0]).toBe(mockProvider);
    
    // Should not find providers for unsupported types
    const drawProviders = registry.getProvidersByAnimationType(AnimationType.DRAW);
    expect(drawProviders).toHaveLength(0);
  });
  
  it('should get the default provider for a type', () => {
    registry.registerProvider(mockProvider);
    
    // Should find the provider for supported types
    const fadeInProvider = registry.getDefaultProviderForType(AnimationType.FADE_IN);
    expect(fadeInProvider).toBe(mockProvider);
    
    // Should return undefined for unsupported types
    const drawProvider = registry.getDefaultProviderForType(AnimationType.DRAW);
    expect(drawProvider).toBeUndefined();
  });
  
  it('should check if an animation type is supported', () => {
    registry.registerProvider(mockProvider);
    
    // Should return true for supported types
    expect(registry.isAnimationTypeSupported(AnimationType.FADE_IN)).toBe(true);
    
    // Should return false for unsupported types
    expect(registry.isAnimationTypeSupported(AnimationType.DRAW)).toBe(false);
  });
  
  it('should unregister a provider', () => {
    registry.registerProvider(mockProvider);
    expect(registry.getAllProviders()).toHaveLength(1);
    
    // Unregister the provider
    const result = registry.unregisterProvider(mockProvider.id);
    expect(result).toBe(true);
    expect(registry.getAllProviders()).toHaveLength(0);
    
    // Should return false when trying to unregister a non-existent provider
    expect(registry.unregisterProvider('non-existent-id')).toBe(false);
  });
  
  it('should clear all providers', () => {
    registry.registerProvider(mockProvider);
    registry.registerProvider({
      ...mockProvider,
      id: 'another-provider'
    } as AnimationProvider);
    
    expect(registry.getAllProviders()).toHaveLength(2);
    
    // Clear all providers
    registry.clearProviders();
    expect(registry.getAllProviders()).toHaveLength(0);
  });
});