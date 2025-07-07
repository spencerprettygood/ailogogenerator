import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SVGAnimationService } from '../animation-service';
import { AnimationType, AnimationEasing, AnimationOptions } from '../types';
import { CSSAnimationProvider } from '../providers/css-provider';

// Mock SVG for testing
const testSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>
`;

// DOM mock setup for testing
const setupDomMock = () => {
  // Mock DOMParser
  global.DOMParser = class DOMParser {
    parseFromString(str: string) {
      // Simple mock that just returns an object with necessary methods
      return {
        querySelector: (selector: string) => {
          if (selector === 'parsererror') return null;
          if (selector === 'svg') return { attributes: [] };
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: () => [],
      };
    }
  } as any;

  // Mock XMLSerializer
  global.XMLSerializer = class XMLSerializer {
    serializeToString() {
      return testSvg;
    }
  } as any;
};

describe('SVGAnimationService', () => {
  let service: SVGAnimationService;

  beforeEach(() => {
    // Set up DOM mocks
    setupDomMock();

    // Create a new service instance for each test
    service = new SVGAnimationService();

    // Register a CSS provider
    service.registerProvider(new CSSAnimationProvider());
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  test('should initialize with a registry', () => {
    expect(service).toBeDefined();
    expect(service.getProviders().length).toBe(1);
  });

  test('should apply fade-in animation', async () => {
    const options: AnimationOptions = {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_OUT,
        delay: 0,
        iterations: 1,
      },
    };

    const result = await service.animateSVG(testSvg, options);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(typeof result.result?.animatedSvg).toBe('string');
    expect(typeof result.result?.cssCode).toBe('string');
    expect(result.result?.cssCode).toContain('@keyframes');
    expect(result.result?.cssCode).toContain('fade_in');
  });

  test('should handle empty SVG gracefully', async () => {
    const options: AnimationOptions = {
      type: AnimationType.FADE_IN,
      timing: { duration: 1000 },
    };

    const result = await service.animateSVG('', options);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Failed to animate SVG');
  });

  test('should merge options with defaults', async () => {
    // Create a spy to check the options passed to the provider
    const cssProvider = new CSSAnimationProvider();
    const animateSpy = vi.spyOn(cssProvider, 'animate');

    service.registerProvider(cssProvider);

    // Create options with minimal settings
    const options: AnimationOptions = {
      type: AnimationType.FADE_IN,
      timing: { duration: 1000 },
    };

    await service.animateSVG(testSvg, options);

    // Verify the options were merged with defaults
    const passedOptions = animateSpy.mock.calls[0][1];
    expect(passedOptions.timing.easing).toBeDefined();
    expect(passedOptions.timing.delay).toBeDefined();
    expect(passedOptions.timing.iterations).toBeDefined();
  });
});
