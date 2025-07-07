import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CSSAnimationProvider } from '../providers/css-provider';
import { AnimationType, AnimationEasing, AnimationTrigger } from '../types';
import { MockDOMParser, MockXMLSerializer, simpleSvg, textSvg } from './utils/mock-svg';

// Mock DOM APIs for testing in Node environment
global.DOMParser = MockDOMParser as any;
global.XMLSerializer = MockXMLSerializer as any;

describe('CSSAnimationProvider', () => {
  let provider: CSSAnimationProvider;

  beforeEach(() => {
    provider = new CSSAnimationProvider();
  });

  it('should have the correct ID and name', () => {
    expect(provider.id).toBe('css-provider');
    expect(provider.name).toBe('CSS Animation Provider');
  });

  it('should correctly identify supported animation types', () => {
    // Test some supported types
    expect(provider.supportsAnimationType(AnimationType.FADE_IN)).toBe(true);
    expect(provider.supportsAnimationType(AnimationType.ZOOM_IN)).toBe(true);
    expect(provider.supportsAnimationType(AnimationType.SPIN)).toBe(true);

    // Test some unsupported types
    expect(provider.supportsAnimationType(AnimationType.MORPH)).toBe(false);
    expect(provider.supportsAnimationType(AnimationType.TYPEWRITER)).toBe(false);
  });

  it('should generate fade-in animation', async () => {
    const result = await provider.animate(simpleSvg, {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain('fadeIn');
    expect(result.cssCode).toContain('keyframes');
    expect(result.cssCode).toContain('animation');
  });

  it('should generate zoom-in animation', async () => {
    const result = await provider.animate(simpleSvg, {
      type: AnimationType.ZOOM_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_OUT,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain('zoomIn');
    expect(result.cssCode).toContain('scale');
  });

  it('should generate spin animation', async () => {
    const result = await provider.animate(simpleSvg, {
      type: AnimationType.SPIN,
      timing: {
        duration: 2000,
        easing: AnimationEasing.LINEAR,
        iterations: 3,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain('spin');
    expect(result.cssCode).toContain('rotate');
    expect(result.cssCode).toContain('3'); // iterations
  });

  it('should generate custom animation with custom keyframes', async () => {
    const customKeyframes = `
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    `;

    const result = await provider.animate(simpleSvg, {
      type: AnimationType.CUSTOM,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE,
      },
      customKeyframes,
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain('customAnimation');
    expect(result.cssCode).toContain(customKeyframes.trim());
  });

  it('should handle hover trigger', async () => {
    const result = await provider.animate(simpleSvg, {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      },
      trigger: AnimationTrigger.HOVER,
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain(':hover');
    expect(result.cssCode).not.toContain('animation-play-state');
  });

  it('should handle click trigger', async () => {
    const result = await provider.animate(simpleSvg, {
      type: AnimationType.ZOOM_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      },
      trigger: AnimationTrigger.CLICK,
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain('.clicked');
    expect(result.jsCode).toContain('addEventListener');
    expect(result.jsCode).toContain('click');
  });

  it('should handle staggered animations for sequential type', async () => {
    vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
      if (selector === '*') {
        return [{ tagName: 'rect' }, { tagName: 'circle' }, { tagName: 'path' }] as any;
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
    expect(result.cssCode).toContain('animation-delay');
    expect(result.cssCode).toMatch(/animation-delay:\s*0.2s/); // Second element delay
    expect(result.cssCode).toMatch(/animation-delay:\s*0.4s/); // Third element delay
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
    // @ts-ignore - Testing with an unsupported type
    const result = await provider.animate(simpleSvg, {
      type: 'unsupported_type',
      timing: {
        duration: 1000,
      },
    });

    expect(result.originalSvg).toBe(simpleSvg);
    expect(result.animatedSvg).toContain('svg');
    expect(result.cssCode).toContain('fadeIn'); // Default animation
  });
});
