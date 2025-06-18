import { SVGAnimationService } from '../../animation/animation-service';
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
    
    // Apply animation to the SVG logo
    const animationResponse = await SVGAnimationService.animateSVG(input.svg, animationOptions);
    
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
 */
async function selectAppropriateAnimation(svg: string, brandName: string): Promise<AnimationOptions> {
  // Parse the SVG to analyze its structure
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
  
  // Check for paths that could work with the draw animation
  const hasPaths = svgDoc.querySelectorAll('path').length > 0;
  
  // Check if there are distinct elements that could be sequentially animated
  const hasMultipleElements = svgDoc.querySelector('svg')?.children.length > 3;
  
  // Check if there's text in the logo
  const hasText = svgDoc.querySelectorAll('text').length > 0;
  
  // Select animation type based on logo characteristics
  let animationType: AnimationType;
  
  if (hasPaths && !hasText) {
    animationType = AnimationType.DRAW;
  } else if (hasMultipleElements) {
    animationType = AnimationType.SEQUENTIAL;
  } else {
    // Default to fade-in for simple logos or logos with text
    animationType = AnimationType.FADE_IN;
  }
  
  // Create and return animation options
  return {
    type: animationType,
    timing: {
      duration: 1500,
      easing: 'ease-out'
    }
  };
}