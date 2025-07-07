import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { animateLogo } from '../stages/stage-i-animation';
import { SVGAnimationService, svgAnimationService } from '../../animation/animation-service';
import { AnimationType, AnimationEasing, AnimationTrigger } from '../../animation/types';

// Sample SVG for testing
const sampleSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#4f46e5" />
  <path d="M30 50 L70 50 M50 30 L50 70" stroke="white" stroke-width="8" stroke-linecap="round" />
</svg>
`;

// Mock the SVGAnimationService
vi.mock('../../animation/animation-service', () => ({
  SVGAnimationService: class {},
  svgAnimationService: {
    animateSVG: vi.fn(),
  },
}));

describe('Stage I: Animation', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully animate a logo with default options', async () => {
    // Mock successful animation
    vi.mocked(svgAnimationService.animateSVG).mockResolvedValue({
      success: true,
      result: {
        originalSvg: sampleSvg,
        animatedSvg: `<svg class="animated">...</svg>`,
        animationOptions: {
          type: AnimationType.FADE_IN,
          timing: {
            duration: 1000,
            easing: AnimationEasing.EASE_IN_OUT,
          },
        },
        cssCode: '.animated { animation: fadeIn 1s ease-in-out; }',
      },
    });

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
    });

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result?.cssCode).toContain('fadeIn');
    expect(svgAnimationService.animateSVG).toHaveBeenCalledWith(
      sampleSvg,
      expect.objectContaining({
        type: AnimationType.FADE_IN,
      })
    );
  });

  it('should use provided animation options when specified', async () => {
    // Mock successful animation
    vi.mocked(svgAnimationService.animateSVG).mockResolvedValue({
      success: true,
      result: {
        originalSvg: sampleSvg,
        animatedSvg: `<svg class="animated">...</svg>`,
        animationOptions: {
          type: AnimationType.ZOOM_IN,
          timing: {
            duration: 2000,
            easing: AnimationEasing.BOUNCE,
          },
        },
        cssCode: '.animated { animation: zoomIn 2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }',
      },
    });

    const customOptions = {
      type: AnimationType.ZOOM_IN,
      timing: {
        duration: 2000,
        easing: AnimationEasing.BOUNCE,
      },
    };

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
      animationOptions: customOptions,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(svgAnimationService.animateSVG).toHaveBeenCalledWith(sampleSvg, customOptions);
  });

  it('should auto-select an appropriate animation when requested', async () => {
    // First mock the DOMParser for the selectAppropriateAnimation function
    global.DOMParser = vi.fn(() => ({
      parseFromString: vi.fn(() => ({
        querySelectorAll: (selector: string) => {
          if (selector === 'path') return [1, 2, 3]; // Mock 3 paths
          if (selector === 'text') return [];
          return [];
        },
        querySelector: (selector: string) => {
          if (selector === 'svg') {
            return {
              children: [1, 2, 3, 4], // Mock 4 children elements
            };
          }
          return null;
        },
      })),
    })) as any;

    // Mock successful animation
    vi.mocked(svgAnimationService.animateSVG).mockResolvedValue({
      success: true,
      result: {
        originalSvg: sampleSvg,
        animatedSvg: `<svg class="animated">...</svg>`,
        animationOptions: {
          type: AnimationType.DRAW, // Should auto-select DRAW for paths
          timing: {
            duration: 1500,
            easing: AnimationEasing.EASE_OUT,
          },
        },
        cssCode: '.animated { animation: drawPath 1.5s ease-out; }',
      },
    });

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
      autoSelectAnimation: true,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(svgAnimationService.animateSVG).toHaveBeenCalledWith(
      sampleSvg,
      expect.objectContaining({
        type: AnimationType.DRAW,
      })
    );
  });

  it('should handle animation service failures', async () => {
    // Mock animation failure
    vi.mocked(svgAnimationService.animateSVG).mockResolvedValue({
      success: false,
      error: {
        message: 'Animation service error',
        details: 'Invalid SVG structure',
      },
    });

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Failed to animate logo');
    expect(result.error?.details).toContain('Animation service error');
  });

  it('should handle exceptions during processing', async () => {
    // Mock exception during animation
    vi.mocked(svgAnimationService.animateSVG).mockImplementation(() => {
      throw new Error('Unexpected error during animation');
    });

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Failed to animate logo');
    expect(result.error?.details).toContain('Unexpected error during animation');
  });

  it('should track processing time', async () => {
    // Mock successful animation with a delay
    vi.mocked(svgAnimationService.animateSVG).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      return {
        success: true,
        result: {
          originalSvg: sampleSvg,
          animatedSvg: `<svg class="animated">...</svg>`,
          animationOptions: {
            type: AnimationType.FADE_IN,
            timing: {
              duration: 1000,
              easing: AnimationEasing.EASE_IN_OUT,
            },
          },
          cssCode: '.animated { animation: fadeIn 1s ease-in-out; }',
        },
      };
    });

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
    });

    expect(result.success).toBe(true);
    expect(result.processingTime).toBeGreaterThan(0);
  });

  it('should select sequential animation for SVGs with multiple elements', async () => {
    // Mock DOMParser for a logo with many elements
    global.DOMParser = vi.fn(() => ({
      parseFromString: vi.fn(() => ({
        querySelectorAll: (selector: string) => {
          if (selector === 'path') return []; // No paths
          if (selector === 'text') return [];
          return [];
        },
        querySelector: (selector: string) => {
          if (selector === 'svg') {
            return {
              children: Array(10).fill(0), // Mock 10 children elements
            };
          }
          return null;
        },
      })),
    })) as any;

    // Mock successful animation
    vi.mocked(svgAnimationService.animateSVG).mockResolvedValue({
      success: true,
      result: {
        originalSvg: sampleSvg,
        animatedSvg: `<svg class="animated">...</svg>`,
        animationOptions: {
          type: AnimationType.SEQUENTIAL,
          timing: {
            duration: 1500,
            easing: AnimationEasing.EASE_OUT,
          },
        },
        cssCode: '.animated > * { animation: fadeIn 1.5s ease-out; }',
      },
    });

    const result = await animateLogo({
      svg: sampleSvg,
      brandName: 'TestBrand',
      autoSelectAnimation: true,
    });

    expect(result.success).toBe(true);
    expect(svgAnimationService.animateSVG).toHaveBeenCalledWith(
      sampleSvg,
      expect.objectContaining({
        type: AnimationType.SEQUENTIAL,
      })
    );
  });
});
