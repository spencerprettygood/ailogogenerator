import { SVGAccessibilityValidator } from '../svg-accessibility-validator';

// Sample SVGs for testing
const goodAccessibilitySVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Test Logo">
  <title>Test Company Logo</title>
  <desc>A circular logo for Test Company with blue and white colors</desc>
  <circle cx="50" cy="50" r="40" fill="#0066cc" />
  <text x="50" y="55" font-size="1.2em" fill="#ffffff" text-anchor="middle">TC</text>
</svg>`;

const poorAccessibilitySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="#cccccc" />
  <text x="50" y="55" font-size="10" fill="#dddddd">TC</text>
</svg>`;

const interactiveSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <a href="https://example.com">
    <circle cx="50" cy="50" r="40" fill="blue" />
  </a>
</svg>`;

describe('SVGAccessibilityValidator', () => {
  describe('validateAccessibility', () => {
    it('should correctly assess a good accessibility SVG', () => {
      const result = SVGAccessibilityValidator.validateAccessibility(goodAccessibilitySVG);
      expect(result.isValid).toBe(true);
      expect(result.accessibilityAssessment).toBeDefined();
      expect(result.accessibilityAssessment?.overallAccessibility).toBeGreaterThanOrEqual(70);
      expect(result.accessibilityAssessment?.textAlternatives).toBeGreaterThanOrEqual(80);
    });

    it('should correctly identify issues in a poor accessibility SVG', () => {
      const result = SVGAccessibilityValidator.validateAccessibility(poorAccessibilitySVG);
      expect(result.isValid).toBe(true);
      expect(result.accessibilityAssessment).toBeDefined();
      expect(result.accessibilityAssessment?.textAlternatives).toBeLessThan(50);
      expect(result.accessibilityAssessment?.accessibilitySuggestions.length).toBeGreaterThan(0);
    });

    it('should assess color contrast correctly', () => {
      const goodContrastSVG = goodAccessibilitySVG;
      const poorContrastSVG = poorAccessibilitySVG;
      
      const goodResult = SVGAccessibilityValidator.validateAccessibility(goodContrastSVG);
      const poorResult = SVGAccessibilityValidator.validateAccessibility(poorContrastSVG);
      
      expect(goodResult.accessibilityAssessment?.colorContrast).toBeGreaterThan(
        poorResult.accessibilityAssessment?.colorContrast || 0
      );
    });

    it('should assess interactive elements correctly', () => {
      const result = SVGAccessibilityValidator.validateAccessibility(interactiveSVG);
      expect(result.accessibilityAssessment?.interactiveElements).toBeLessThan(70);
      expect(result.accessibilityAssessment?.accessibilitySuggestions.some(s => 
        s.includes('interactive') || s.includes('aria-label')
      )).toBe(true);
    });
  });

  describe('processWithAccessibilityAssessment', () => {
    it('should process and assess SVG correctly', () => {
      const result = SVGAccessibilityValidator.processWithAccessibilityAssessment(poorAccessibilitySVG);
      expect(result.success).toBe(true);
      expect(result.accessibilityAssessment).toBeDefined();
      expect(result.svg).toBeDefined();
    });

    it('should apply repairs when requested', () => {
      const result = SVGAccessibilityValidator.processWithAccessibilityAssessment(poorAccessibilitySVG, {
        repair: true,
        optimize: true
      });
      expect(result.success).toBe(true);
      expect(result.repair).toBeDefined();
    });
  });

  describe('processWithDesignAndAccessibility', () => {
    it('should process both design quality and accessibility', () => {
      const result = SVGAccessibilityValidator.processWithDesignAndAccessibility(goodAccessibilitySVG);
      expect(result.success).toBe(true);
      expect(result.designQuality).toBeDefined();
      expect(result.accessibilityAssessment).toBeDefined();
    });

    it('should skip accessibility assessment when not requested', () => {
      const result = SVGAccessibilityValidator.processWithDesignAndAccessibility(goodAccessibilitySVG, {
        assessAccessibility: false
      });
      expect(result.success).toBe(true);
      expect(result.designQuality).toBeDefined();
      expect(result.accessibilityAssessment).toBeUndefined();
    });
  });
});