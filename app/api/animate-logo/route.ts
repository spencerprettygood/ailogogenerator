import { NextRequest, NextResponse } from 'next/server';
import { SVGAnimationService } from '@/lib/animation/animation-service';
import { AnimationOptions, AnimationType, AnimationEasing, AnimationTrigger } from '@/lib/animation/types';
import { sanitizeSVGForAnimation, isAnimatable } from '@/lib/animation/utils/svg-sanitizer';
import { SVGValidator } from '@/lib/utils/svg-validator';

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1', 'lhr1'], // Deploy to multiple regions for lower latency
};

/**
 * API route for animating SVG logos
 * 
 * Request Body:
 * - svg: SVG content to animate
 * - animationType: Type of animation to apply (from AnimationType enum)
 * - options: Additional animation options
 * 
 * Response:
 * - animatedSvg: SVG with animation applied
 * - cssCode: CSS code for the animation (if needed)
 * - jsCode: JavaScript code for the animation (if needed)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { svg, animationType, options = {} } = await request.json();
    
    // Validate required parameters
    if (!svg) {
      return NextResponse.json(
        { error: 'Missing required parameter: svg' },
        { status: 400 }
      );
    }
    
    if (!animationType) {
      return NextResponse.json(
        { error: 'Missing required parameter: animationType' },
        { status: 400 }
      );
    }
    
    // Validate animation type
    if (!Object.values(AnimationType).includes(animationType as AnimationType)) {
      return NextResponse.json(
        { 
          error: 'Invalid animation type',
          validTypes: Object.values(AnimationType)
        },
        { status: 400 }
      );
    }
    
    // Validate and sanitize SVG content
    const validationResult = SVGValidator.validate(svg);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid SVG content', 
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }
    
    // Check if SVG is animatable
    const animatableCheck = isAnimatable(svg);
    if (!animatableCheck.animatable) {
      return NextResponse.json(
        { 
          error: 'SVG is not animatable', 
          issues: animatableCheck.issues 
        },
        { status: 400 }
      );
    }
    
    // If SVG has issues but is still animatable, include warnings in the response
    const warnings = animatableCheck.issues.length > 0 ? animatableCheck.issues : undefined;
    
    // Sanitize SVG for animation
    const sanitizeResult = sanitizeSVGForAnimation(svg);
    if (sanitizeResult.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Error sanitizing SVG',
          details: sanitizeResult.errors
        },
        { status: 400 }
      );
    }
    
    // Use the sanitized SVG
    const sanitizedSvg = sanitizeResult.svg;
    
    // Parse animation options
    const animationOptions: AnimationOptions = {
      type: animationType as AnimationType,
      timing: {
        duration: options.duration || 1000,
        delay: options.delay || 0,
        easing: (options.easing as AnimationEasing) || AnimationEasing.EASE_IN_OUT,
        iterations: options.iterations || 1,
        direction: options.direction || 'normal'
      },
      trigger: (options.trigger as AnimationTrigger) || AnimationTrigger.LOAD,
      ...options
    };
    
    // Apply animation to SVG
    const result = await SVGAnimationService.animateSVG(sanitizedSvg, animationOptions);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to animate SVG',
          details: result.error?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // Return animated SVG
    return NextResponse.json({
      animatedSvg: result.result?.animatedSvg,
      cssCode: result.result?.cssCode,
      jsCode: result.result?.jsCode,
      warnings,
      processingTime: result.processingTime
    });
    
  } catch (error) {
    console.error('Error animating SVG:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to return supported animation types
 */
export async function GET() {
  return NextResponse.json({
    supportedAnimationTypes: Object.values(AnimationType),
    supportedEasingFunctions: Object.values(AnimationEasing),
    supportedTriggers: Object.values(AnimationTrigger)
  });
}