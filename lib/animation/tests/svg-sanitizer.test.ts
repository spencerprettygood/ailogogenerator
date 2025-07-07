import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  sanitizeSVGForAnimation,
  isAnimatable,
  prepareSVGForAnimation,
} from '../utils/svg-sanitizer';
import {
  simpleSvg,
  pathSvg,
  smilAnimatedSvg,
  insecureSvg,
  invalidSvg,
  missingViewBoxSvg,
  complexSvg,
  MockDOMParser,
  MockXMLSerializer,
} from './utils/mock-svg';

// Mock DOM APIs for testing in Node environment
beforeAll(() => {
  global.DOMParser = MockDOMParser as any;
  global.XMLSerializer = MockXMLSerializer as any;
  global.document = {
    createNodeIterator: () => ({
      nextNode: () => null,
    }),
  } as any;
  global.NodeFilter = {
    SHOW_COMMENT: 128,
    FILTER_ACCEPT: 1,
  } as any;
});

describe('SVG Sanitizer', () => {
  describe('sanitizeSVGForAnimation', () => {
    it('should handle empty or invalid input', () => {
      const result = sanitizeSVGForAnimation('');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.isModified).toBe(false);
    });

    it('should sanitize a simple SVG correctly', () => {
      const result = sanitizeSVGForAnimation(simpleSvg);
      expect(result.errors.length).toBe(0);
      expect(result.svg).toBeTruthy();
    });

    it('should remove SMIL animations when not allowed', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'animate, animateTransform, animateMotion, set') {
          return [{ parentNode: { removeChild: vi.fn() } }] as any;
        }
        return [] as any;
      });

      const result = sanitizeSVGForAnimation(smilAnimatedSvg, { allowSMIL: false });
      expect(result.modifications.some(m => m.includes('Removed'))).toBe(true);
    });

    it('should preserve SMIL animations when allowed', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        return [] as any; // Return empty to simulate no elements found/removed
      });

      const result = sanitizeSVGForAnimation(smilAnimatedSvg, { allowSMIL: true });
      expect(result.modifications.some(m => m.includes('Removed'))).toBe(false);
    });

    it('should add IDs to elements when requested', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path, rect, circle, ellipse, line, polyline, polygon, text, g') {
          return [
            { id: '', tagName: 'path' },
            { id: '', tagName: 'circle' },
          ] as any;
        }
        return [] as any;
      });

      const result = sanitizeSVGForAnimation(pathSvg, { addElementIds: true });
      expect(result.modifications.some(m => m.includes('Added IDs'))).toBe(true);
    });

    it('should add viewBox when missing and autoFix is enabled', () => {
      vi.spyOn(document.querySelector('svg') as any, 'hasAttribute').mockImplementation(
        (attr: string) => attr !== 'viewBox'
      );

      const result = sanitizeSVGForAnimation(missingViewBoxSvg, { autoFix: true });
      expect(result.modifications.some(m => m.includes('Added missing viewBox'))).toBe(true);
    });

    it('should not add viewBox when autoFix is disabled', () => {
      vi.spyOn(document.querySelector('svg') as any, 'hasAttribute').mockImplementation(
        (attr: string) => attr !== 'viewBox'
      );

      const result = sanitizeSVGForAnimation(missingViewBoxSvg, { autoFix: false });
      expect(result.modifications.some(m => m.includes('Added missing viewBox'))).toBe(false);
    });

    it('should add stroke-width when needed and ensureStrokeWidth is enabled', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path, line, polyline, polygon, rect, circle, ellipse') {
          return [
            {
              getAttribute: (attr: string) => (attr === 'stroke' ? 'black' : null),
              setAttribute: vi.fn(),
            },
            {
              getAttribute: (attr: string) => (attr === 'stroke' ? 'red' : null),
              setAttribute: vi.fn(),
            },
          ] as any;
        }
        return [] as any;
      });

      const result = sanitizeSVGForAnimation(pathSvg, { ensureStrokeWidth: true });
      expect(result.modifications.some(m => m.includes('Added stroke-width'))).toBe(true);
    });

    it('should handle parsing errors gracefully', () => {
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === 'parsererror') {
          return {} as any; // Return an object to simulate parsing error
        }
        return null;
      });

      const result = sanitizeSVGForAnimation(invalidSvg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.isModified).toBe(false);
    });
  });

  describe('isAnimatable', () => {
    it('should identify a simple SVG as animatable', () => {
      const result = isAnimatable(simpleSvg);
      expect(result.animatable).toBe(true);
      expect(result.complexity).toBe('simple');
    });

    it('should identify an invalid SVG as not animatable', () => {
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector === 'parsererror') {
          return {} as any; // Return an object to simulate parsing error
        }
        return null;
      });

      const result = isAnimatable(invalidSvg);
      expect(result.animatable).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should identify a complex SVG correctly', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === '*') {
          // Return an array with 600 elements to simulate complexity
          return Array(600).fill({}) as any;
        }
        return [] as any;
      });

      const result = isAnimatable(complexSvg);
      expect(result.animatable).toBe(true);
      expect(result.complexity).toBe('complex');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect SVGs with filters as moderate complexity', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'filter') {
          return [{}] as any; // Return a non-empty array for filters
        }
        if (selector === '*') {
          return Array(100).fill({}) as any;
        }
        return [] as any;
      });

      const result = isAnimatable(simpleSvg);
      expect(result.animatable).toBe(true);
      expect(result.complexity).toBe('moderate');
    });

    it('should detect SVGs with foreignObjects as complex', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'foreignObject') {
          return [{}] as any; // Return a non-empty array for foreignObjects
        }
        return [] as any;
      });

      const result = isAnimatable(simpleSvg);
      expect(result.animatable).toBe(true);
      expect(result.complexity).toBe('complex');
      expect(result.issues.some(issue => issue.includes('foreignObject'))).toBe(true);
    });
  });

  describe('prepareSVGForAnimation', () => {
    it('should prepare SVG for draw animation', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path') {
          return [
            {
              setAttribute: vi.fn(),
              getAttribute: (attr: string) => null,
            },
            {
              setAttribute: vi.fn(),
              getAttribute: (attr: string) => null,
            },
          ] as any;
        }
        return [] as any;
      });

      const result = prepareSVGForAnimation(pathSvg, 'draw');
      expect(result).toBeTruthy();
    });

    it('should prepare SVG for morph animation', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === 'path') {
          return [
            {
              id: '',
              setAttribute: vi.fn(),
              getAttribute: (attr: string) => null,
            },
            {
              id: '',
              setAttribute: vi.fn(),
              getAttribute: (attr: string) => null,
            },
          ] as any;
        }
        return [] as any;
      });

      const result = prepareSVGForAnimation(pathSvg, 'morph');
      expect(result).toBeTruthy();
    });

    it('should prepare SVG for sequential animation', () => {
      vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => {
        if (selector === '*') {
          return [
            {
              tagName: 'rect',
              setAttribute: vi.fn(),
            },
            {
              tagName: 'circle',
              setAttribute: vi.fn(),
            },
          ] as any;
        }
        return [] as any;
      });

      const result = prepareSVGForAnimation(simpleSvg, 'sequential');
      expect(result).toBeTruthy();
    });

    it('should throw an error if sanitization fails', () => {
      vi.spyOn(global, 'sanitizeSVGForAnimation').mockImplementation(() => ({
        svg: '',
        isModified: false,
        modifications: [],
        errors: ['Sanitization failed'],
        warnings: [],
      }));

      expect(() => prepareSVGForAnimation(invalidSvg, 'draw')).toThrow();
    });
  });
});
