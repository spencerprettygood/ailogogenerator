import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  optimizeSVGForAnimation,
  extractAnimatableElements,
  generateBrowserCompatibilityCheck,
  detectAnimationSupport,
  convertTimingToCSS,
  convertTimingToSMIL
} from '../utils/animation-utils';
import { AnimationEasing } from '../types';
import { MockDOMParser, MockXMLSerializer, simpleSvg, pathSvg } from './utils/mock-svg';

// Mock DOM APIs for testing in Node environment
global.DOMParser = MockDOMParser as any;
global.XMLSerializer = MockXMLSerializer as any;

describe('Animation Utilities', () => {
  describe('optimizeSVGForAnimation', () => {
    it('should optimize SVG by adding IDs to elements without them', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path, rect, circle, ellipse, polygon, polyline, g, text') {
          return [
            { id: '', tagName: 'rect', setAttribute: vi.fn() },
            { id: 'existing-id', tagName: 'circle', setAttribute: vi.fn() },
            { id: '', tagName: 'path', setAttribute: vi.fn() }
          ] as any;
        }
        return [] as any;
      });

      const result = optimizeSVGForAnimation(simpleSvg);
      expect(result.isOptimized).toBe(true);
      expect(result.modifications).toContain('Added IDs to elements');
    });

    it('should not modify SVG that is already optimized', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path, rect, circle, ellipse, polygon, polyline, g, text') {
          return [
            { id: 'rect-1', tagName: 'rect' },
            { id: 'circle-1', tagName: 'circle' }
          ] as any;
        }
        return [] as any;
      });

      const result = optimizeSVGForAnimation(simpleSvg);
      expect(result.isOptimized).toBe(true);
      expect(result.modifications).toEqual([]);
    });

    it('should ensure stroke-width on elements with stroke', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path, line, polyline, polygon, rect, circle, ellipse') {
          return [
            { 
              getAttribute: (attr: string) => attr === 'stroke' ? 'black' : null,
              setAttribute: vi.fn()
            }
          ] as any;
        }
        return [] as any;
      });

      const result = optimizeSVGForAnimation(pathSvg);
      expect(result.isOptimized).toBe(true);
      expect(result.modifications).toContain('Added missing stroke-width');
    });

    it('should handle invalid SVG', () => {
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === 'parsererror') {
          return {} as any; // Return an object to simulate parsing error
        }
        return null;
      });

      const result = optimizeSVGForAnimation('<invalid>svg</invalid>');
      expect(result.isOptimized).toBe(false);
      expect(result.errors).toContain('Invalid SVG');
    });
  });

  describe('extractAnimatableElements', () => {
    it('should extract paths for draw animation', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path') {
          return [
            { id: 'path-1', getAttribute: () => 'd="M10,10 L90,90"' },
            { id: 'path-2', getAttribute: () => 'd="M20,20 C30,30 40,40 50,50"' }
          ] as any;
        }
        return [] as any;
      });

      const elements = extractAnimatableElements(pathSvg, 'draw');
      expect(elements.length).toBe(2);
      expect(elements[0].id).toBe('path-1');
      expect(elements[1].id).toBe('path-2');
    });

    it('should extract all direct children for sequential animation', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'svg > *') {
          return [
            { id: 'rect-1', tagName: 'rect' },
            { id: 'circle-1', tagName: 'circle' }
          ] as any;
        }
        return [] as any;
      });

      const elements = extractAnimatableElements(simpleSvg, 'sequential');
      expect(elements.length).toBe(2);
      expect(elements[0].id).toBe('rect-1');
      expect(elements[1].id).toBe('circle-1');
    });

    it('should extract the svg element for whole-logo animations', () => {
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === 'svg') {
          return { id: 'logo', tagName: 'svg' } as any;
        }
        return null;
      });

      const elements = extractAnimatableElements(simpleSvg, 'fade_in');
      expect(elements.length).toBe(1);
      expect(elements[0].id).toBe('logo');
      expect(elements[0].tagName).toBe('svg');
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
      const jsCode = generateBrowserCompatibilityCheck('unsupported_type');
      expect(jsCode).toBe('');
    });
  });

  describe('detectAnimationSupport', () => {
    it('should detect if browser supports animations', () => {
      // Mock browser environment
      global.document = {
        documentElement: {
          style: {
            animation: 'test',
            webkitAnimation: ''
          }
        },
        createElementNS: vi.fn().mockReturnValue({
          animate: vi.fn()
        })
      } as any;

      const support = detectAnimationSupport();
      expect(support.css).toBe(true);
      expect(support.webAnimations).toBe(true);
    });

    it('should detect limited support in older browsers', () => {
      // Mock older browser environment
      global.document = {
        documentElement: {
          style: {
            animation: undefined,
            webkitAnimation: 'test',
            MozAnimation: '',
            OAnimation: ''
          }
        },
        createElementNS: vi.fn().mockReturnValue({
          animate: undefined
        })
      } as any;

      const support = detectAnimationSupport();
      expect(support.css).toBe(true); // Vendor prefixed
      expect(support.webAnimations).toBe(false);
    });

    it('should handle environments without document object', () => {
      // Mock environment without document object (like Node.js)
      global.document = undefined as any;

      const support = detectAnimationSupport();
      expect(support.css).toBe(false);
      expect(support.smil).toBe(false);
      expect(support.webAnimations).toBe(false);
    });
  });

  describe('convertTimingToCSS', () => {
    it('should convert basic timing to CSS', () => {
      const css = convertTimingToCSS({
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      });
      expect(css).toBe('1s ease-in-out');
    });

    it('should include delay when provided', () => {
      const css = convertTimingToCSS({
        duration: 500,
        delay: 200,
        easing: AnimationEasing.EASE_OUT
      });
      expect(css).toBe('0.5s ease-out 0.2s');
    });

    it('should handle iterations and direction', () => {
      const css = convertTimingToCSS({
        duration: 2000,
        easing: AnimationEasing.LINEAR,
        iterations: 3,
        direction: 'alternate'
      });
      expect(css).toBe('2s linear');
      expect(css).not.toContain('alternate'); // Direction is handled separately
    });

    it('should handle infinite iterations', () => {
      const css = convertTimingToCSS({
        duration: 1000,
        easing: AnimationEasing.BOUNCE,
        iterations: Infinity
      });
      expect(css).toBe('1s cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    });

    it('should handle custom cubic-bezier easing', () => {
      const css = convertTimingToCSS({
        duration: 1000,
        easing: AnimationEasing.ELASTIC
      });
      expect(css).toBe('1s cubic-bezier(.5,2.5,.7,.7)');
    });
  });

  describe('convertTimingToSMIL', () => {
    it('should convert basic timing to SMIL attributes', () => {
      const attrs = convertTimingToSMIL({
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      });
      expect(attrs.dur).toBe('1s');
      expect(attrs.calcMode).toBe('spline');
      expect(attrs.keySplines).toBeDefined();
    });

    it('should include begin attribute for delay', () => {
      const attrs = convertTimingToSMIL({
        duration: 500,
        delay: 200,
        easing: AnimationEasing.EASE_OUT
      });
      expect(attrs.dur).toBe('0.5s');
      expect(attrs.begin).toBe('0.2s');
    });

    it('should handle iterations', () => {
      const attrs = convertTimingToSMIL({
        duration: 2000,
        easing: AnimationEasing.LINEAR,
        iterations: 3
      });
      expect(attrs.dur).toBe('2s');
      expect(attrs.repeatCount).toBe('3');
    });

    it('should handle infinite iterations', () => {
      const attrs = convertTimingToSMIL({
        duration: 1000,
        easing: AnimationEasing.BOUNCE,
        iterations: Infinity
      });
      expect(attrs.dur).toBe('1s');
      expect(attrs.repeatCount).toBe('indefinite');
    });

    it('should handle linear easing specially', () => {
      const attrs = convertTimingToSMIL({
        duration: 1000,
        easing: AnimationEasing.LINEAR
      });
      expect(attrs.calcMode).toBe('linear');
      expect(attrs.keySplines).toBeUndefined();
    });
  });
});