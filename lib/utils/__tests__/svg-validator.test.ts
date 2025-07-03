import { SVGValidator } from '../svg-validator';

describe('SVGValidator', () => {
  // Sample SVGs for testing
  const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <title>Test Logo</title>
    <desc>A simple test logo</desc>
    <rect width="100" height="100" fill="blue" />
  </svg>`;
  
  const validSvgNoTitle = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100" height="100" fill="blue" />
  </svg>`;
  
  const insecureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <script>alert('XSS Attack');</script>
    <rect width="100" height="100" fill="blue" />
  </svg>`;
  
  const malformedSvg = `<svg width="300" height="300">
    <rect width="100" height="100" fill="blue">
  </svg>`;
  
  const oversizedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    ${Array(500).fill('<g><rect x="10" y="10" width="10" height="10" fill="blue" /></g>').join('')}
  </svg>`;
  
  const eventHandlerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100" height="100" fill="blue" onclick="alert('clicked')" />
  </svg>`;
  
  const externalRefSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <image href="javascript:alert('evil')" width="100" height="100" />
  </svg>`;
  
  describe('validate method', () => {
    it('should validate a properly formatted SVG', () => {
      const result = SVGValidator.validate(validSvg);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.securityScore).toBe(100);
      expect(result.accessibilityScore).toBeGreaterThanOrEqual(90);
    });
    
    it('should detect missing accessibility elements', () => {
      const result = SVGValidator.validate(validSvgNoTitle);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'accessibility')).toBe(true);
      expect(result.accessibilityScore).toBeLessThan(90);
    });
    
    it('should detect script elements as security issues', () => {
      const result = SVGValidator.validate(insecureSvg);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'security' && i.severity === 'critical')).toBe(true);
      expect(result.securityScore).toBeLessThan(50);
    });
    
    it('should detect malformed SVG structure', () => {
      const result = SVGValidator.validate(malformedSvg);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'structure')).toBe(true);
    });
    
    it('should detect oversized SVGs', () => {
      const result = SVGValidator.validate(oversizedSvg);
      expect(result.issues.some(i => i.type === 'optimization' && i.message.includes('exceeds maximum file size'))).toBe(true);
      expect(result.optimizationScore).toBeLessThan(90);
    });
    
    it('should detect event handlers as security issues', () => {
      const result = SVGValidator.validate(eventHandlerSvg);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'security' && i.message.includes('disallowed attribute'))).toBe(true);
      expect(result.securityScore).toBeLessThan(70);
    });
    
    it('should detect external references with disallowed protocols', () => {
      const result = SVGValidator.validate(externalRefSvg);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'security' && i.message.includes('disallowed protocol'))).toBe(true);
      expect(result.securityScore).toBeLessThan(70);
    });
  });
  
  describe('repair method', () => {
    it('should repair SVGs with script elements', () => {
      const repairResult = SVGValidator.repair(insecureSvg);
      expect(repairResult.issuesFixed.length).toBeGreaterThan(0);
      expect(repairResult.repaired).not.toContain('<script>');
      
      // Validate the repaired SVG
      const validationResult = SVGValidator.validate(repairResult.repaired);
      expect(validationResult.issues.filter(i => i.type === 'security' && i.severity === 'critical').length).toBe(0);
    });
    
    it('should add missing accessibility elements', () => {
      const repairResult = SVGValidator.repair(validSvgNoTitle);
      expect(repairResult.issuesFixed.some(i => i.type === 'accessibility')).toBe(true);
      expect(repairResult.repaired).toContain('<title');
      expect(repairResult.repaired).toContain('<desc');
      
      // Validate the repaired SVG
      const validationResult = SVGValidator.validate(repairResult.repaired);
      expect(validationResult.accessibilityScore).toBeGreaterThanOrEqual(80);
    });
    
    it('should remove event handlers', () => {
      const repairResult = SVGValidator.repair(eventHandlerSvg);
      expect(repairResult.issuesFixed.some(i => i.message.includes('disallowed attribute'))).toBe(true);
      expect(repairResult.repaired).not.toContain('onclick');
      
      // Validate the repaired SVG
      const validationResult = SVGValidator.validate(repairResult.repaired);
      expect(validationResult.issues.filter(i => i.type === 'security' && i.message.includes('onclick')).length).toBe(0);
    });
    
    it('should fix external references with disallowed protocols', () => {
      const repairResult = SVGValidator.repair(externalRefSvg);
      expect(repairResult.issuesFixed.some(i => i.message.includes('disallowed protocol'))).toBe(true);
      expect(repairResult.repaired).not.toContain('javascript:');
      
      // Validate the repaired SVG
      const validationResult = SVGValidator.validate(repairResult.repaired);
      expect(validationResult.issues.filter(i => i.type === 'security' && i.message.includes('javascript:')).length).toBe(0);
    });
    
    it('should repair SVGs with multiple issues', () => {
      const complexSvg = `<svg width="300" height="300">
        <script>alert('XSS');</script>
        <rect width="100" height="100" fill="blue" onclick="alert('click')" />
        <image href="javascript:alert('evil')" width="100" height="100" />
      </svg>`;
      
      const repairResult = SVGValidator.repair(complexSvg);
      expect(repairResult.issuesFixed.length).toBeGreaterThanOrEqual(3);
      expect(repairResult.repaired).not.toContain('<script>');
      expect(repairResult.repaired).not.toContain('onclick');
      expect(repairResult.repaired).not.toContain('javascript:');
      
      // Validate the repaired SVG
      const validationResult = SVGValidator.validate(repairResult.repaired);
      expect(validationResult.securityScore).toBeGreaterThan(50);
    });
  });
  
  describe('optimize method', () => {
    it('should reduce file size through optimization', () => {
      const unoptimizedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <!-- This is a comment that should be removed -->
        <rect   width="100"   height="100"   fill="blue"   />
        <circle cx="150" cy="150" r="50" fill="red" />
        <path d="M 10.000000 20.000000 L 30.000000 40.000000" stroke="black" />
      </svg>`;
      
      const optimizationResult = SVGValidator.optimize(unoptimizedSvg);
      expect(optimizationResult.optimizedSize).toBeLessThan(optimizationResult.originalSize);
      expect(optimizationResult.optimizations.length).toBeGreaterThan(0);
      expect(optimizationResult.optimized).not.toContain('<!--');
      expect(optimizationResult.optimized).not.toContain('  ');
    });
    
    it('should reduce precision of decimal numbers in paths', () => {
      const svgWithHighPrecision = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <path d="M 10.123456789 20.987654321 L 30.123456789 40.987654321" stroke="black" />
      </svg>`;
      
      const optimizationResult = SVGValidator.optimize(svgWithHighPrecision);
      expect(optimizationResult.optimized).not.toContain('10.123456789');
      expect(optimizationResult.optimized).toContain('10.12');
    });
    
    it('should remove empty attributes and groups', () => {
      const svgWithEmptyElements = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <g></g>
        <rect width="100" height="100" fill="blue" style="" class="" />
      </svg>`;
      
      const optimizationResult = SVGValidator.optimize(svgWithEmptyElements);
      expect(optimizationResult.optimized).not.toContain('<g></g>');
      expect(optimizationResult.optimized).not.toContain('style=""');
      expect(optimizationResult.optimized).not.toContain('class=""');
    });
  });
  
  describe('process method', () => {
    it('should validate, repair, and optimize an SVG in one call', () => {
      const complexSvg = `<svg width="300" height="300">
        <!-- This is a comment that should be removed -->
        <script>alert('XSS');</script>
        <rect width="100" height="100" fill="blue" onclick="alert('click')" />
        <image href="javascript:alert('evil')" width="100" height="100" />
      </svg>`;
      
      const processResult = SVGValidator.process(complexSvg);
      
      // Verify the process was successful
      expect(processResult.success).toBe(true);
      
      // Verify security issues were fixed
      expect(processResult.processed).not.toContain('<script>');
      expect(processResult.processed).not.toContain('onclick');
      expect(processResult.processed).not.toContain('javascript:');
      
      // Verify optimization was applied
      expect(processResult.processed).not.toContain('<!--');
      
      // Verify overall score was calculated
      expect(processResult.overallScore).toBeGreaterThanOrEqual(0);
      expect(processResult.overallScore).toBeLessThanOrEqual(100);
    });
    
    it('should handle valid SVGs properly', () => {
      const processResult = SVGValidator.process(validSvg);
      
      expect(processResult.success).toBe(true);
      expect(processResult.processed).toContain('<title>');
      expect(processResult.processed).toContain('<desc>');
      expect(processResult.overallScore).toBeGreaterThanOrEqual(90);
    });
    
    it('should return original if repair was unsuccessful', () => {
      // Mock SVGValidator.validate to simulate an unrepairable SVG
      const originalValidate = SVGValidator.validate;
      const originalRepair = SVGValidator.repair;
      
      try {
        SVGValidator.validate = jest.fn().mockReturnValue({
          isValid: false,
          issues: [
            {
              type: 'security',
              severity: 'critical',
              message: 'Unrepairable issue',
              autoFixable: false
            }
          ],
          securityScore: 0,
          accessibilityScore: 0,
          optimizationScore: 0,
          fileSize: 100
        });
        
        SVGValidator.repair = jest.fn().mockReturnValue({
          original: 'original',
          repaired: 'original', // No change
          fileSize: {
            before: 100,
            after: 100
          },
          issuesFixed: [],
          issuesRemaining: [
            {
              type: 'security',
              severity: 'critical',
              message: 'Unrepairable issue',
              autoFixable: false
            }
          ]
        });
        
        const result = SVGValidator.process('original', { repair: true, optimize: false });
        
        expect(result.success).toBe(false);
        expect(result.processed).toBe('original'); // Should return original
      } finally {
        // Restore original functions
        SVGValidator.validate = originalValidate;
        SVGValidator.repair = originalRepair;
      }
    });
  });
});