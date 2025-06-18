import { SVGDesignValidator } from '../svg-design-validator';

describe('SVGDesignValidator', () => {
  // Sample SVG for testing
  const validSVG = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <title>Test Logo</title>
    <desc>A test logo for design validation</desc>
    <rect x="50" y="50" width="200" height="200" fill="#3498db" rx="20" />
    <circle cx="150" cy="150" r="80" fill="#ffffff" />
    <path d="M120,120 L180,120 L150,180 Z" fill="#e74c3c" />
  </svg>`;
  
  const poorDesignSVG = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="280" height="280" fill="#ff0000" />
    <rect x="20" y="20" width="260" height="260" fill="#00ff00" />
    <rect x="30" y="30" width="240" height="240" fill="#0000ff" />
    <rect x="40" y="40" width="220" height="220" fill="#ff00ff" />
    <rect x="50" y="50" width="200" height="200" fill="#ffff00" />
    <text x="100" y="150" font-family="Arial" font-size="5">Test Logo</text>
  </svg>`;
  
  test('validateDesignQuality returns scores for a valid SVG', () => {
    const result = SVGDesignValidator.validateDesignQuality(validSVG);
    
    // Check if result has required properties
    expect(result.isValid).toBe(true);
    expect(result.designQualityScore).toBeDefined();
    
    // Check if design quality scores are present
    const scores = result.designQualityScore!;
    expect(scores.colorHarmony).toBeGreaterThan(0);
    expect(scores.composition).toBeGreaterThan(0);
    expect(scores.visualWeight).toBeGreaterThan(0);
    expect(scores.negativeSpace).toBeGreaterThan(0);
    expect(scores.overallAesthetic).toBeGreaterThan(0);
  });
  
  test('validateDesignQuality identifies issues in poor design', () => {
    const result = SVGDesignValidator.validateDesignQuality(poorDesignSVG);
    
    // Check if result has required properties
    expect(result.isValid).toBe(true);
    expect(result.designQualityScore).toBeDefined();
    
    // Check if design quality scores reflect poor design
    const scores = result.designQualityScore!;
    
    // Color harmony should be low due to clashing colors
    expect(scores.colorHarmony).toBeLessThan(70);
    
    // Typography score should be low due to tiny text
    expect(scores.typography).toBeLessThan(70);
    
    // Design suggestions should contain actionable advice
    expect(scores.designSuggestions.length).toBeGreaterThan(0);
  });
  
  test('processWithDesignAssessment repairs and scores SVG', () => {
    // Corrupted SVG with a typo in closing tag
    const corruptedSVG = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <title>Test Logo</title>
      <desc>A test logo for design validation</desc>
      <rect x="50" y="50" width="200" height="200" fill="#3498db" rx="20" />
      <circle cx="150" cy="150" r="80" fill="#ffffff" />
      <path d="M120,120 L180,120 L150,180 Z" fill="#e74c3c" />
    </svg`;
    
    const result = SVGDesignValidator.processWithDesignAssessment(corruptedSVG);
    
    // Check if SVG was repaired
    expect(result.success).toBe(true);
    expect(result.svg).toContain('</svg>');
    
    // Check if design quality was assessed
    expect(result.designQuality).toBeDefined();
    expect(result.designQuality!.colorHarmony).toBeGreaterThan(0);
  });
  
  test('extractColors correctly identifies colors in SVG', () => {
    // This is testing a private method, so we'd use a workaround in a real test
    // For this example, we'll just check the public method that uses it
    const result = SVGDesignValidator.validateDesignQuality(validSVG);
    
    // If color extraction works, we should have a color harmony score
    expect(result.designQualityScore!.colorHarmony).toBeGreaterThan(0);
  });
});