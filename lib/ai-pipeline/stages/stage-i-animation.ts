import { SVGAnimationService, svgAnimationService } from '../../animation/animation-service';
import { AnimationOptions, AnimatedSVGLogo, AnimationType } from '../../animation/types';
import { SVGLogo } from '../../types';

export interface StageIInput {
  svg: string;
  brandName: string;
  animationOptions?: AnimationOptions;
  autoSelectAnimation?: boolean; // Whether to automatically select an appropriate animation based on the logo
}

export interface StageIOutput {
  success: boolean;
  result?: {
    animatedSVG: AnimatedSVGLogo;
    animationOptions: AnimationOptions;
    cssCode: string;
    jsCode?: string;
    previewUrl?: string;
  };
  error?: {
    message: string;
    details?: string;
  };
  tokensUsed?: number;
  processingTime?: number;
}

/**
 * Stage I: Animation - Adds animations to the SVG logo
 * 
 * @param input The input containing the SVG logo and animation options
 * @returns The output with the animated SVG logo
 */
export async function animateLogo(input: StageIInput): Promise<StageIOutput> {
  const startTime = Date.now();
  
  try {
    // Determine animation options
    let animationOptions: AnimationOptions;
    
    if (input.animationOptions) {
      // Use provided animation options
      animationOptions = input.animationOptions;
    } else if (input.autoSelectAnimation) {
      // Auto-select an appropriate animation based on the logo
      animationOptions = await selectAppropriateAnimation(input.svg, input.brandName);
    } else {
      // Use default fade-in animation
      animationOptions = {
        type: AnimationType.FADE_IN,
        timing: {
          duration: 1000,
          easing: 'ease-in-out'
        }
      };
    }
    
    // Apply animation to the SVG logo using the singleton instance
    const animationResponse = await svgAnimationService.animateSVG(input.svg, animationOptions);
    
    if (!animationResponse.success) {
      throw new Error(`Animation failed: ${animationResponse.error?.message}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      result: {
        animatedSVG: animationResponse.result!,
        animationOptions,
        cssCode: animationResponse.result!.cssCode || '',
        jsCode: animationResponse.result!.jsCode
      },
      processingTime
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      error: {
        message: 'Failed to animate logo',
        details: error instanceof Error ? error.message : String(error)
      },
      processingTime
    };
  }
}

/**
 * Analyzes a logo and selects an appropriate animation type based on its characteristics
 * Uses regex-based analysis for server-side compatibility
 */
async function selectAppropriateAnimation(svg: string, brandName: string): Promise<AnimationOptions> {
  try {
    let hasPaths = false;
    let hasText = false;
    let topLevelCount = 0;

    // Use DOMParser if available (for test), else fallback to regex
    if (typeof global !== 'undefined' && typeof (global as any).DOMParser === 'function') {
      try {
        const parser = new (global as any).DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.querySelector && doc.querySelector('svg');
        if (svgEl && svgEl.children) {
          topLevelCount = svgEl.children.length;
        }
        // Also check for paths and text using DOMParser when available
        const paths = doc.querySelectorAll && doc.querySelectorAll('path');
        const texts = doc.querySelectorAll && doc.querySelectorAll('text');
        hasPaths = paths && paths.length > 0;
        hasText = texts && texts.length > 0;
      } catch (e) {
        // fallback below
      }
    }
    
    // Fallback to regex if DOMParser failed or not available
    if (!topLevelCount) {
      hasPaths = /<path[^>]*>/i.test(svg);
      hasText = /<text[^>]*>/i.test(svg);
      
      const svgTagMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      if (svgTagMatch) {
        const inner = svgTagMatch[1] || '';
        const tagMatches = inner.match(/<([a-zA-Z]+)[^>]*>/g) || [];
        topLevelCount = tagMatches.length;
      }
    }

    const hasMultipleElements = topLevelCount > 3;

    // Select animation type based on logo characteristics
    let animationType: AnimationType;
    let timing: { duration: number; easing: string };
    
    // Check if we have many elements that should be animated sequentially
    if (hasMultipleElements && topLevelCount > 5) {
      animationType = AnimationType.SEQUENTIAL;
      timing = { duration: 1500, easing: 'ease-out' };
    } else if (hasPaths && !hasText) {
      // Prioritize path drawing for SVGs with paths (but not too many elements)
      animationType = AnimationType.DRAW;
      timing = { duration: 2000, easing: 'ease-in-out' };
    } else if (hasMultipleElements) {
      animationType = AnimationType.SEQUENTIAL;
      timing = { duration: 1500, easing: 'ease-out' };
    } else if (hasText && !hasPaths) {
      animationType = AnimationType.TYPEWRITER;
      timing = { duration: 2500, easing: 'ease-out' };
    } else if (brandName.toLowerCase().includes('tech') || 
               brandName.toLowerCase().includes('digital') || 
               brandName.toLowerCase().includes('data')) {
      animationType = AnimationType.ZOOM_IN;
      timing = { duration: 1200, easing: 'ease-out' };
    } else if (brandName.toLowerCase().includes('fun') || 
               brandName.toLowerCase().includes('kids') || 
               brandName.toLowerCase().includes('play')) {
      animationType = AnimationType.BOUNCE;
      timing = { duration: 1200, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' };
    } else {
      animationType = AnimationType.FADE_IN;
      timing = { duration: 1000, easing: 'ease-in-out' };
    }
    const animationOptions: AnimationOptions = {
      type: animationType,
      timing
    };
    if (animationType === AnimationType.SEQUENTIAL) {
      (animationOptions as any).stagger = 150;
    }
    return animationOptions;
  } catch (error) {
    console.error('Error selecting appropriate animation:', error);
    return {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: 'ease-in-out'
      }
    };
  }
}