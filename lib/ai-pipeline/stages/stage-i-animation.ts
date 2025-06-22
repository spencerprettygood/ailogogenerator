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
    
    // Apply animation to the SVG logo using the singleton instance
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
 * Uses regex-based analysis for server-side compatibility
 */
async function selectAppropriateAnimation(svg: string, brandName: string): Promise<AnimationOptions> {
  try {
    // Use regex to determine logo characteristics for server-side compatibility
    const hasPaths = /<path[^>]*>/i.test(svg);
    const hasText = /<text[^>]*>/i.test(svg);
    
    // Count root level elements as a rough proxy for complexity
    const elementCount = (svg.match(/<(?:path|rect|circle|ellipse|line|polyline|polygon|text|g)[^>]*>/gi) || []).length;
    const hasMultipleElements = elementCount > 3;
    
    // Select animation type based on logo characteristics
    let animationType: AnimationType;
    
    if (hasPaths && !hasText) {
      // Path-based logos without text work well with drawing animations
      animationType = AnimationType.DRAW;
    } else if (hasMultipleElements) {
      // Complex logos with multiple elements work well with sequential animations
      animationType = AnimationType.SEQUENTIAL;
    } else if (hasText && !hasPaths) {
      // Text-only logos work well with typewriter animations
      animationType = AnimationType.TYPEWRITER;
    } else if (brandName.toLowerCase().includes('tech') || 
               brandName.toLowerCase().includes('digital') || 
               brandName.toLowerCase().includes('data')) {
      // Tech-related brands often look good with zoom-in animations
      animationType = AnimationType.ZOOM_IN;
    } else if (brandName.toLowerCase().includes('fun') || 
               brandName.toLowerCase().includes('kids') || 
               brandName.toLowerCase().includes('play')) {
      // Playful brands work well with bounce animations
      animationType = AnimationType.BOUNCE;
    } else {
      // Default to fade-in for simple logos or unclassified cases
      animationType = AnimationType.FADE_IN;
    }
    
    // Create animation options with appropriate timing for the selected type
    const animationOptions: AnimationOptions = {
      type: animationType,
      timing: {
        // Adjust duration and easing based on animation type
        duration: animationType === AnimationType.DRAW ? 2000 : 
                  animationType === AnimationType.SEQUENTIAL ? 1800 : 
                  animationType === AnimationType.TYPEWRITER ? 2500 : 1200,
        easing: animationType === AnimationType.BOUNCE ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 
                animationType === AnimationType.DRAW ? 'ease-in-out' : 'ease-out'
      }
    };
    
    // Add additional options for specific animation types
    if (animationType === AnimationType.SEQUENTIAL) {
      animationOptions.stagger = 150; // 150ms between each element
    }
    
    return animationOptions;
  } catch (error) {
    console.error('Error selecting appropriate animation:', error);
    
    // Return a safe default option in case of errors
    return {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: 'ease-in-out'
      }
    };
  }
}