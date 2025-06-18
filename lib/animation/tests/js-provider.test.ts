import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSAnimationProvider } from '../providers/js-provider';
import { AnimationType, AnimationEasing, AnimationTrigger } from '../types';

// Mock SVG for testing
const mockSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" />
  <circle cx="50" cy="50" r="30" fill="red" />
  <path d="M10,10 L90,90" stroke="black" />
</svg>
`;

// Mock path SVG for testing path-specific animations
const mockPathSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M10,10 C30,30 50,10 90,90" stroke="black" fill="none" />
  <path d="M90,10 C70,30 50,10 10,90" stroke="black" fill="none" />
</svg>
`;

// Mock text SVG for testing text animations
const mockTextSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="50">Hello World</text>
</svg>
`;

// Mock DOM APIs for testing in Node environment
global.DOMParser = class DOMParser {
  parseFromString(str: string, type: string) {
    // Return a simplified mock based on the SVG type
    if (str.includes('<text')) {
      return {
        querySelector: (selector: string) => {
          if (selector === 'svg') {
            return {
              hasAttribute: (attr: string) => attr === 'viewBox',
              getAttribute: (attr: string) => attr === 'viewBox' ? '0 0 100 100' : null,
              setAttribute: vi.fn()
            };
          }
          return null;
        },
        querySelectorAll: (selector: string) => {
          if (selector === 'text') {
            return [{
              textContent: 'Hello World',
              appendChild: vi.fn(),
              getAttribute: () => null,
              setAttribute: vi.fn()
            }];
          }
          return [];
        },
        getElementsByTagName: () => []
      } as any;
    } else if (str.includes('<path')) {
      return {
        querySelector: (selector: string) => {
          if (selector === 'svg') {
            return {
              hasAttribute: (attr: string) => attr === 'viewBox',
              getAttribute: (attr: string) => attr === 'viewBox' ? '0 0 100 100' : null,
              setAttribute: vi.fn()
            };
          }
          return null;
        },
        querySelectorAll: (selector: string) => {
          if (selector === 'path') {
            return [
              { setAttribute: vi.fn(), getAttribute: () => null },
              { setAttribute: vi.fn(), getAttribute: () => null }
            ];
          }
          return [];
        },
        getElementsByTagName: () => []
      } as any;
    } else {
      return {
        querySelector: (selector: string) => {
          if (selector === 'svg') {
            return {
              hasAttribute: (attr: string) => attr === 'viewBox',
              getAttribute: (attr: string) => attr === 'viewBox' ? '0 0 100 100' : null,
              setAttribute: vi.fn()
            };
          }
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: () => []
      } as any;
    }
  }
};

global.XMLSerializer = class XMLSerializer {
  serializeToString(doc: Document) {
    // Return the appropriate mock SVG based on doc content
    if (doc.querySelector && doc.querySelector('text')) {
      return mockTextSvg;
    } else if (doc.querySelector && doc.querySelector('path')) {
      return mockPathSvg;
    }
    return mockSvg;
  }
};

describe('JSAnimationProvider', () => {
  let provider: JSAnimationProvider;

  beforeEach(() => {
    provider = new JSAnimationProvider();
  });

  it('should have the correct ID and name', () => {
    expect(provider.id).toBe('js-provider');
    expect(provider.name).toBe('JavaScript Animation Provider');
  });

  it('should correctly identify supported animation types', () => {
    // Test some supported types
    expect(provider.supportsAnimationType(AnimationType.MORPH)).toBe(true);
    expect(provider.supportsAnimationType(AnimationType.DRAW)).toBe(true);
    expect(provider.supportsAnimationType(AnimationType.TYPEWRITER)).toBe(true);
    
    // Test some unsupported types
    expect(provider.supportsAnimationType(AnimationType.FADE_IN)).toBe(false);
    expect(provider.supportsAnimationType(AnimationType.ZOOM_IN)).toBe(false);
  });

  it('should generate morph animation for path SVGs', async () => {
    const result = await provider.animate(mockPathSvg, {
      type: AnimationType.MORPH,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      }
    });

    expect(result.originalSvg).toBe(mockPathSvg);
    expect(result.animatedSvg).toBe(mockPathSvg);
    expect(result.jsCode).toContain('Morph Animation');
    expect(result.jsCode).toContain('interpolatePath');
  });

  it('should generate draw animation for path SVGs', async () => {
    const result = await provider.animate(mockPathSvg, {
      type: AnimationType.DRAW,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      }
    });

    expect(result.originalSvg).toBe(mockPathSvg);
    expect(result.animatedSvg).toBe(mockPathSvg);
    expect(result.jsCode).toContain('Draw Animation');
    expect(result.jsCode).toContain('strokeDasharray');
  });

  it('should generate typewriter animation for text SVGs', async () => {
    const result = await provider.animate(mockTextSvg, {
      type: AnimationType.TYPEWRITER,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      }
    });

    expect(result.originalSvg).toBe(mockTextSvg);
    expect(result.animatedSvg).toBe(mockTextSvg);
    expect(result.jsCode).toContain('Typewriter Animation');
    expect(result.jsCode).toContain('tspan');
  });

  it('should generate wave animation', async () => {
    const result = await provider.animate(mockSvg, {
      type: AnimationType.WAVE,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      }
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toContain('Wave Animation');
    expect(result.jsCode).toContain('sineWave');
  });

  it('should generate shimmer animation', async () => {
    const result = await provider.animate(mockSvg, {
      type: AnimationType.SHIMMER,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      }
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toContain('Shimmer Animation');
    expect(result.jsCode).toContain('shimmerRect');
  });

  it('should generate sequential animation', async () => {
    const result = await provider.animate(mockSvg, {
      type: AnimationType.SEQUENTIAL,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_OUT
      },
      stagger: 200
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toContain('Sequential Animation');
    expect(result.jsCode).toContain('stagger');
  });

  it('should generate float animation', async () => {
    const result = await provider.animate(mockSvg, {
      type: AnimationType.FLOAT,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: Infinity
      }
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toContain('Float Animation');
    expect(result.jsCode).toContain('Math.sin');
  });

  it('should generate pulse animation', async () => {
    const result = await provider.animate(mockSvg, {
      type: AnimationType.PULSE,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 3
      }
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toContain('Pulse Animation');
    expect(result.jsCode).toContain('scale');
  });

  it('should handle custom animations', async () => {
    const customJS = `
      document.querySelector('svg').style.opacity = 0.5;
    `;
    
    const result = await provider.animate(mockSvg, {
      type: AnimationType.CUSTOM,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE
      },
      jsCode: customJS
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toBe(customJS);
  });

  it('should apply default animation when type is not supported', async () => {
    // @ts-ignore - Testing with an unsupported type
    const result = await provider.animate(mockSvg, {
      type: 'unsupported_type',
      timing: {
        duration: 1000
      }
    });

    expect(result.originalSvg).toBe(mockSvg);
    expect(result.animatedSvg).toBe(mockSvg);
    expect(result.jsCode).toContain('Default Animation');
  });

  it('should handle errors during animation', async () => {
    // Mock the validateSVG method to throw an error
    vi.spyOn(provider as any, 'validateSVG').mockImplementation(() => {
      throw new Error('Validation error');
    });

    await expect(provider.animate(mockSvg, {
      type: AnimationType.MORPH,
      timing: {
        duration: 1000
      }
    })).rejects.toThrow('Validation error');
  });
});