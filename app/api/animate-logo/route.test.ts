import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from './route';
import { SVGAnimationService } from '@/lib/animation/animation-service';
import { SVGValidator } from '@/lib/utils/svg-validator';
import { isAnimatable, sanitizeSVGForAnimation } from '@/lib/animation/utils/svg-sanitizer';
import { AnimationType, AnimationEasing, AnimationTrigger } from '@/lib/animation/types';
import { NextRequest } from 'next/server';

// Mock dependencies

vi.mock('@/lib/utils/svg-validator', () => ({
  SVGValidator: {
    validate: vi.fn(),
  },
}));

vi.mock('@/lib/animation/utils/svg-sanitizer', () => ({
  isAnimatable: vi.fn(),
  sanitizeSVGForAnimation: vi.fn(),
}));

// Sample SVG for testing
const sampleSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#4f46e5" />
</svg>
`;

describe('Animate Logo API', () => {
  // Mock NextRequest
  const createMockRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST handler', () => {
    it('should return 400 when SVG is missing', async () => {
      const req = createMockRequest({ animationType: AnimationType.FADE_IN });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter: svg');
    });

    it('should return 400 when animation type is missing', async () => {
      const req = createMockRequest({ svg: sampleSvg });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter: animationType');
    });

    it('should return 400 when animation type is invalid', async () => {
      const req = createMockRequest({
        svg: sampleSvg,
        animationType: 'not_a_valid_type',
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid animation type');
    });

    it('should return 400 when SVG is invalid', async () => {
      vi.mocked(SVGValidator.validate).mockReturnValue({
        isValid: false,
        errors: ['Invalid SVG format'],
        violations: {},
        warnings: [],
        issues: [],
      });

      const req = createMockRequest({
        svg: '<invalid>svg</invalid>',
        animationType: AnimationType.FADE_IN,
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid SVG content');
    });

    it('should return 400 when SVG is not animatable', async () => {
      vi.mocked(SVGValidator.validate).mockReturnValue({
        isValid: true,
        errors: [],
        violations: {},
        warnings: [],
        issues: [],
      });

      vi.mocked(isAnimatable).mockReturnValue({
        animatable: false,
        complexity: 'complex',
        issues: ['Too many elements', 'Unsupported features'],
      });

      const req = createMockRequest({
        svg: sampleSvg,
        animationType: AnimationType.FADE_IN,
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('SVG is not animatable');
    });

    it('should return 400 when SVG sanitization fails', async () => {
      vi.mocked(SVGValidator.validate).mockReturnValue({
        isValid: true,
        errors: [],
        violations: {},
        warnings: [],
        issues: [],
      });

      vi.mocked(isAnimatable).mockReturnValue({
        animatable: true,
        complexity: 'simple',
        issues: [],
      });

      vi.mocked(sanitizeSVGForAnimation).mockReturnValue({
        svg: '',
        isModified: false,
        modifications: [],
        errors: ['Error parsing SVG'],
        warnings: [],
      });

      const req = createMockRequest({
        svg: sampleSvg,
        animationType: AnimationType.FADE_IN,
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Error sanitizing SVG');
    });

    it('should return 500 when animation service fails', async () => {
      vi.mocked(SVGValidator.validate).mockReturnValue({
        isValid: true,
        errors: [],
        violations: {},
        warnings: [],
        issues: [],
      });

      vi.mocked(isAnimatable).mockReturnValue({
        animatable: true,
        complexity: 'simple',
        issues: [],
      });

      vi.mocked(sanitizeSVGForAnimation).mockReturnValue({
        svg: sampleSvg,
        isModified: false,
        modifications: [],
        errors: [],
        warnings: [],
      });

      vi.spyOn(SVGAnimationService.prototype, 'animateSVG').mockResolvedValue({
        success: false,
        error: {
          message: 'Animation service error',
          details: 'Failed to apply animation',
        },
      });

      const req = createMockRequest({
        svg: sampleSvg,
        animationType: AnimationType.FADE_IN,
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to animate SVG');
    });

    it('should successfully animate SVG and return results', async () => {
      vi.mocked(SVGValidator.validate).mockReturnValue({
        isValid: true,
        errors: [],
        violations: {},
        warnings: [],
        issues: [],
      });

      vi.mocked(isAnimatable).mockReturnValue({
        animatable: true,
        complexity: 'simple',
        issues: [],
      });

      vi.mocked(sanitizeSVGForAnimation).mockReturnValue({
        svg: sampleSvg,
        isModified: false,
        modifications: [],
        errors: [],
        warnings: [],
      });

      vi.spyOn(SVGAnimationService.prototype, 'animateSVG').mockResolvedValue({
        success: true,
        result: {
          originalSvg: sampleSvg,
          animatedSvg: '<svg class="animated">...</svg>',
          animationOptions: {
            type: AnimationType.FADE_IN,
            timing: {
              duration: 1000,
              easing: AnimationEasing.EASE_IN_OUT,
            },
          },
          cssCode: '.animated { animation: fadeIn 1s ease-in-out; }',
        },
        processingTime: 50,
      });

      const req = createMockRequest({
        svg: sampleSvg,
        animationType: AnimationType.FADE_IN,
        options: {
          duration: 1000,
          easing: AnimationEasing.EASE_IN_OUT,
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.animatedSvg).toContain('animated');
      expect(data.cssCode).toContain('fadeIn');
      expect(data.processingTime).toBe(50);
    });

    it('should include warnings in the response when SVG has issues', async () => {
      vi.mocked(SVGValidator.validate).mockReturnValue({
        isValid: true,
        errors: [],
        violations: {},
        warnings: [],
        issues: [],
      });

      vi.mocked(isAnimatable).mockReturnValue({
        animatable: true,
        complexity: 'moderate',
        issues: ['Complex gradients may affect performance'],
      });

      vi.mocked(sanitizeSVGForAnimation).mockReturnValue({
        svg: sampleSvg,
        isModified: true,
        modifications: ['Added missing IDs to elements'],
        errors: [],
        warnings: ['Some elements had missing IDs'],
      });

      vi.spyOn(SVGAnimationService.prototype, 'animateSVG').mockResolvedValue({
        success: true,
        result: {
          originalSvg: sampleSvg,
          animatedSvg: '<svg class="animated">...</svg>',
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

      const req = createMockRequest({
        svg: sampleSvg,
        animationType: AnimationType.FADE_IN,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.warnings).toContain('Complex gradients may affect performance');
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(SVGValidator.validate).mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

      const req = createMockRequest({
        svg: sampleSvg,
        animationType: AnimationType.FADE_IN,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
      expect(data.details).toContain('Unexpected validation error');
    });
  });

  describe('GET handler', () => {
    it('should return supported animation types, easing functions, and triggers', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.supportedAnimationTypes).toEqual(Object.values(AnimationType));
      expect(data.supportedEasingFunctions).toEqual(Object.values(AnimationEasing));
      expect(data.supportedTriggers).toEqual(Object.values(AnimationTrigger));
    });
  });
});
