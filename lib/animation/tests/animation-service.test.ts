/**
 * Animation service tests
 */
import { SVGAnimationService, animationTemplates } from '../animation-service';
import { AnimationType, AnimationEasing, AnimationOptions } from '../types';

// Sample SVG for testing
const sampleSvg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#4f46e5" />
  <path d="M30 50 L70 50 M50 30 L50 70" stroke="white" stroke-width="8" stroke-linecap="round" />
</svg>
`;

describe('SVGAnimationService', () => {
  // Test animation templates
  describe('Animation Templates', () => {
    test('should have predefined animation templates', () => {
      expect(animationTemplates).toBeDefined();
      expect(animationTemplates.length).toBeGreaterThan(0);
    });
    
    test('should have valid options in templates', () => {
      animationTemplates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.defaultOptions).toBeDefined();
        expect(template.defaultOptions.type).toBeDefined();
        expect(template.defaultOptions.timing).toBeDefined();
      });
    });
  });
  
  // Test animation service methods
  describe('SVG Animation', () => {
    test('should animate SVG with fade-in animation', async () => {
      const options: AnimationOptions = {
        type: AnimationType.FADE_IN,
        timing: {
          duration: 1000,
          easing: AnimationEasing.EASE_IN_OUT
        }
      };
      
      const response = await SVGAnimationService.animateSVG(sampleSvg, options);
      
      expect(response.success).toBe(true);
      expect(response.result).toBeDefined();
      expect(response.result?.animatedSvg).toContain('svg');
      expect(response.result?.cssCode).toContain('fadeIn');
      expect(response.result?.cssCode).toContain('animation');
    });
    
    test('should animate SVG with custom animation', async () => {
      const options: AnimationOptions = {
        type: AnimationType.CUSTOM,
        timing: {
          duration: 1000,
          easing: AnimationEasing.EASE_IN_OUT
        },
        customKeyframes: `
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        `
      };
      
      const response = await SVGAnimationService.animateSVG(sampleSvg, options);
      
      expect(response.success).toBe(true);
      expect(response.result).toBeDefined();
      expect(response.result?.animatedSvg).toContain('svg');
      expect(response.result?.cssCode).toContain('customAnimation');
      expect(response.result?.cssCode).toContain(options.customKeyframes);
    });
    
    test('should handle errors gracefully', async () => {
      const invalidSvg = '<invalid></invalid>';
      const options: AnimationOptions = {
        type: AnimationType.FADE_IN,
        timing: {
          duration: 1000,
          easing: AnimationEasing.EASE_IN_OUT
        }
      };
      
      const response = await SVGAnimationService.animateSVG(invalidSvg, options);
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});