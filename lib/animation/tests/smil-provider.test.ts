import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SMILAnimationProvider } from '../providers/smil-provider';
import { AnimationType, AnimationEasing } from '../types';
import { simpleSvg, pathSvg, textSvg, MockDOMParser, MockXMLSerializer } from './utils/mock-svg';

// Mock DOM APIs for testing in Node environment
global.DOMParser = MockDOMParser as any;
global.XMLSerializer = MockXMLSerializer as any;

describe('SMILAnimationProvider', () => {
  let provider: SMILAnimationProvider;

  beforeEach(() => {
    provider = new SMILAnimationProvider();
  });

  it('should have the correct ID and name', () => {
    expect(provider.id).toBe('smil-provider');
    expect(provider.name).toBe('SMIL Animation Provider');
  });

  it('should correctly identify supported animation types', () => {
    // Test some supported types
    expect(provider.supportsAnimationType(AnimationType.FADE_IN)).toBe(true);
    expect(provider.supportsAnimationType(AnimationType.SPIN)).toBe(true);
    expect(provider.supportsAnimationType(AnimationType.DRAW)).toBe(true);

    // Test some unsupported types (SMIL can handle most animations, so this list might be small)
    expect(provider.supportsAnimationType(AnimationType.TYPEWRITER)).toBe(false);
  });

  it('should generate fade-in animation using animate element', async () => {
    // Mock the element selection and appendChild methods
    vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
      if (selector === 'svg > *') {
        return [
          {
            appendChild: vi.fn(),
            getAttribute: () => null,
            setAttribute: vi.fn(),
          },
        ] as any;
      }
      return [] as any;
    });

    const result = await provider.animate(simpleSvg, {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.animatedSvg).not.toContain('cssCode'); // SMIL doesn't need CSS
    expect(result.animatedSvg).not.toContain('jsCode'); // SMIL doesn't need JS
  });

  it('should generate path drawing animation', async () => {
    // Mock the element selection methods
    vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
      if (selector === 'path') {
        return [
          {
            appendChild: vi.fn(),
            getAttribute: (attr: string) => (attr === 'd' ? 'M10,10 L90,90' : null),
            setAttribute: vi.fn(),
            getTotalLength: () => 100,
          },
        ] as any;
      }
      return [] as any;
    });

    const result = await provider.animate(pathSvg, {
      type: AnimationType.DRAW,
      timing: {
        duration: 2000,
        easing: AnimationEasing.EASE_OUT,
      },
    });

    expect(result.originalSvg).toBe(pathSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.animatedSvg).toContain('animateMotion');
  });

  it('should generate spin animation using animateTransform', async () => {
    // Mock the SVG element and appendChild methods
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'svg') {
        return {
          appendChild: vi.fn(),
          getAttribute: (attr: string) => {
            if (attr === 'viewBox') return '0 0 100 100';
            if (attr === 'width') return '100';
            if (attr === 'height') return '100';
            return null;
          },
          setAttribute: vi.fn(),
        } as any;
      }
      return null;
    });

    const result = await provider.animate(simpleSvg, {
      type: AnimationType.SPIN,
      timing: {
        duration: 3000,
        iterations: Infinity,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.animatedSvg).toContain('animateTransform');
    expect(result.animatedSvg).toContain('rotate');
  });

  it('should generate sequential animation with begin offset', async () => {
    // Mock multiple elements
    vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
      if (selector === 'svg > *') {
        return [
          {
            appendChild: vi.fn(),
            getAttribute: () => null,
            setAttribute: vi.fn(),
          },
          {
            appendChild: vi.fn(),
            getAttribute: () => null,
            setAttribute: vi.fn(),
          },
          {
            appendChild: vi.fn(),
            getAttribute: () => null,
            setAttribute: vi.fn(),
          },
        ] as any;
      }
      return [] as any;
    });

    const result = await provider.animate(simpleSvg, {
      type: AnimationType.SEQUENTIAL,
      timing: {
        duration: 500,
        easing: AnimationEasing.EASE_OUT,
      },
      stagger: 200,
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.animatedSvg).toContain('animate');
    // SMIL would use begin attribute for staggering
  });

  it('should handle infinite iterations', async () => {
    // Mock the SVG element
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'svg') {
        return {
          appendChild: vi.fn(),
          getAttribute: (attr: string) => (attr === 'viewBox' ? '0 0 100 100' : null),
          setAttribute: vi.fn(),
        } as any;
      }
      return null;
    });

    const result = await provider.animate(simpleSvg, {
      type: AnimationType.PULSE,
      timing: {
        duration: 2000,
        iterations: Infinity,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.animatedSvg).toContain('animate');
    expect(result.animatedSvg).toContain('indefinite'); // SMIL uses "indefinite" for infinite
  });

  it('should handle custom animations', async () => {
    // Not all providers support custom animations in the same way
    // For SMIL, we can test a basic implementation or a fallback

    const result = await provider.animate(simpleSvg, {
      type: AnimationType.CUSTOM,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE,
      },
      // A custom SMIL code snippet could be provided here if the provider supports it
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    // Check for either custom animation implementation or fallback
  });

  it('should generate bounce animation', async () => {
    const result = await provider.animate(simpleSvg, {
      type: AnimationType.BOUNCE,
      timing: {
        duration: 1000,
        easing: AnimationEasing.BOUNCE,
        iterations: 2,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.animatedSvg).toContain('animate');
    // SMIL would use values attribute for bounce effect
  });

  it('should handle errors during animation', async () => {
    // Mock the validateSVG method to throw an error
    vi.spyOn(provider as any, 'validateSVG').mockImplementation(() => {
      throw new Error('Validation error');
    });

    await expect(
      provider.animate(simpleSvg, {
        type: AnimationType.FADE_IN,
        timing: {
          duration: 1000,
        },
      })
    ).rejects.toThrow('Validation error');
  });

  it('should apply default animation when type is not supported', async () => {
    const result = await provider.animate(simpleSvg, {
      type: 'unsupported_type' as AnimationType,
      timing: {
        duration: 1000,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    // Should fallback to a default animation the SMIL provider supports
  });
});
