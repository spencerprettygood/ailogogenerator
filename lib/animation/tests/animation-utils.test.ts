import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  optimizeSVGForAnimation,
  extractAnimatableElements,
  generateBrowserCompatibilityCheck,
  detectAnimationSupport,
  convertTimingToCSS,
  convertTimingToSMIL,
} from '../utils/animation-utils';
import { AnimationEasing, AnimationType } from '../types';
import { simpleSvg, pathSvg } from './utils/mock-svg';

// Relies on the jsdom environment provided by Vitest.

describe('Animation Utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('optimizeSVGForAnimation', () => {
    it('should optimize SVG by adding IDs to elements without them', () => {
      const optimizedResult = optimizeSVGForAnimation(simpleSvg);
      expect(optimizedResult.isOptimized).toBe(true);
      expect(optimizedResult.modifications).toContain('Added IDs to 2 elements');
      const doc = new DOMParser().parseFromString(optimizedResult.svg, 'image/svg+xml');
      expect(doc.querySelector('rect')?.id).not.toBe('');
      expect(doc.querySelector('circle')?.id).not.toBe('');
    });

    it('should not modify SVG that is already optimized', () => {
      const alreadyOptimizedSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect id="rect-1" x="10" y="10" width="80" height="80" fill="blue" />
  <circle id="circle-1" cx="50" cy="50" r="30" fill="red" />
</svg>
      `;
      const result = optimizeSVGForAnimation(alreadyOptimizedSvg);
      expect(result.isOptimized).toBe(true);
      // It will still report adding stroke-width if missing, so we check for ID modification only.
      const hasIdModification = result.modifications.some(m => m.startsWith('Added IDs'));
      expect(hasIdModification).toBe(false);
    });

    it('should ensure stroke-width on elements with stroke', () => {
      const result = optimizeSVGForAnimation(pathSvg);
      expect(result.isOptimized).toBe(true);
      expect(result.modifications).toContain('Added missing stroke-width to 2 elements');
      const doc = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
      doc.querySelectorAll('path').forEach(p => {
        expect(p.getAttribute('stroke-width')).toBe('1');
      });
    });

    it('should handle invalid SVG', () => {
      const result = optimizeSVGForAnimation('<invalid>svg</invalid>');
      expect(result.isOptimized).toBe(false);
      expect(result.errors).toContain('Invalid SVG: parsererror found in document');
    });
  });

  describe('extractAnimatableElements', () => {
    it('should extract paths for draw animation', () => {
      const elements = extractAnimatableElements(pathSvg, AnimationType.DRAW);
      expect(elements.length).toBe(2);
      expect(elements[0]?.tagName.toLowerCase()).toBe('path');
    });

    it('should extract all direct children for sequential animation', () => {
      const elements = extractAnimatableElements(simpleSvg, AnimationType.SEQUENTIAL);
      expect(elements.length).toBe(2);
      expect(elements[0]?.tagName.toLowerCase()).toBe('rect');
      expect(elements[1]?.tagName.toLowerCase()).toBe('circle');
    });

    it('should extract the svg element for whole-logo animations', () => {
      const elements = extractAnimatableElements(simpleSvg, AnimationType.FADE_IN);
      expect(elements.length).toBe(1);
      expect(elements[0]?.tagName.toLowerCase()).toBe('svg');
    });

    it('should return empty array for unsupported animation types', () => {
      const elements = extractAnimatableElements(simpleSvg, 'unsupported_type' as any);
      expect(elements.length).toBe(0);
    });
  });

  describe('generateBrowserCompatibilityCheck', () => {
    it('should generate CSS animation support check', () => {
      const jsCode = generateBrowserCompatibilityCheck('css');
      expect(jsCode).toContain('animation');
      expect(jsCode).toContain('function');
      expect(jsCode).toContain('document.documentElement.style');
    });

    it('should generate SMIL animation support check', () => {
      const jsCode = generateBrowserCompatibilityCheck('smil');
      expect(jsCode).toContain('SMIL');
      expect(jsCode).toContain('createElementNS');
      expect(jsCode).toContain('animate');
    });

    it('should generate WebAnimations API support check', () => {
      const jsCode = generateBrowserCompatibilityCheck('web-animations');
      expect(jsCode).toContain('animate');
      expect(jsCode).toContain('Element.prototype');
    });

    it('should return empty string for unsupported animation type', () => {
      const jsCode = generateBrowserCompatibilityCheck('unsupported_type' as any);
      expect(jsCode).toBe('');
    });
  });

  describe('detectAnimationSupport', () => {
    it('should detect if browser supports animations', () => {
      const support = detectAnimationSupport();
      expect(support.css).toBe(true);
      expect(support.smil).toBe(true);
      expect(support.webAnimations).toBe(true);
    });

    it('should detect limited support in older browsers', () => {
      const docStyle = document.documentElement.style;
      vi.spyOn(docStyle, 'animation' as any, 'get').mockReturnValue('');
      vi.spyOn(docStyle, 'webkitAnimation' as any, 'get').mockReturnValue('');
      vi.spyOn(Element.prototype, 'animate').mockReturnValue(undefined as any);

      const support = detectAnimationSupport();
      expect(support.css).toBe(true);
      expect(support.webAnimations).toBe(false);
    });

    it('should handle environments without window object', () => {
      const originalWindow = global.window;
      (global as any).window = undefined;

      const support = detectAnimationSupport();
      expect(support.css).toBe(false);
      expect(support.smil).toBe(false);
      expect(support.webAnimations).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('convertTimingToCSS', () => {
    it('should convert basic timing to CSS', () => {
      const css = convertTimingToCSS({
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      });
      expect(css).toBe('1000ms ease-in-out');
    });

    it('should include delay when provided', () => {
      const css = convertTimingToCSS({
        duration: 500,
        delay: 200,
        easing: AnimationEasing.EASE_OUT,
      });
      expect(css).toBe('500ms 200ms ease-out');
    });

    it('should handle iterations and direction', () => {
      const css = convertTimingToCSS({
        duration: 2000,
        easing: AnimationEasing.LINEAR,
        iterations: 3,
        direction: 'alternate',
      });
      expect(css).toBe('2000ms linear 3 alternate');
    });

    it('should handle infinite iterations', () => {
      const css = convertTimingToCSS({
        duration: 1000,
        easing: AnimationEasing.BOUNCE,
        iterations: Infinity,
      });
      expect(css).toBe('1000ms cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite');
    });

    it('should handle custom cubic-bezier easing', () => {
      const css = convertTimingToCSS({
        duration: 1000,
        easing: 'cubic-bezier(0.1, 0.7, 1.0, 0.1)',
      });
      expect(css).toBe('1000ms cubic-bezier(0.1, 0.7, 1.0, 0.1)');
    });
  });

  describe('convertTimingToSMIL', () => {
    it('should convert basic timing to SMIL attributes', () => {
      const attrs = convertTimingToSMIL({
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT,
      });
      expect(attrs.dur).toBe('1s');
      expect(attrs.calcMode).toBe('spline');
      expect(attrs.keySplines).toBe('0.42 0 0.58 1');
    });

    it('should include begin attribute for delay', () => {
      const attrs = convertTimingToSMIL({
        duration: 500,
        delay: 200,
        easing: AnimationEasing.EASE_OUT,
      });
      expect(attrs.dur).toBe('0.5s');
      expect(attrs.begin).toBe('0.2s');
    });

    it('should handle iterations', () => {
      const attrs = convertTimingToSMIL({
        duration: 2000,
        easing: AnimationEasing.LINEAR,
        iterations: 3,
      });
      expect(attrs.dur).toBe('2s');
      expect(attrs.repeatCount).toBe('3');
    });

    it('should handle infinite iterations', () => {
      const attrs = convertTimingToSMIL({
        duration: 1000,
        easing: AnimationEasing.BOUNCE,
        iterations: Infinity,
      });
      expect(attrs.dur).toBe('1s');
      expect(attrs.repeatCount).toBe('indefinite');
    });

    it('should handle linear easing specially', () => {
      const attrs = convertTimingToSMIL({
        duration: 1000,
        easing: AnimationEasing.LINEAR,
      });
      expect(attrs.calcMode).toBe('linear');
      expect(attrs.keySplines).toBeUndefined();
    });
  });
});
