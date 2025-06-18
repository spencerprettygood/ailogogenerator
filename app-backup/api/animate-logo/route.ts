import { NextRequest, NextResponse } from 'next/server';
import { defaultAnimationService } from '../../../lib/animation';
import { AnimationOptions, AnimationType, AnimationEasing } from '../../../lib/animation/types';
import { Logger } from '../../../lib/utils/logger';
import { AnimationErrorCode } from '../../../lib/animation/animation-service';

// Create a logger instance for this API route
const logger = new Logger('API:AnimateLogo');

/**
 * Map animation error codes to HTTP status codes
 */
const errorToStatusCode = {
  [AnimationErrorCode.INVALID_INPUT]: 400,
  [AnimationErrorCode.PROVIDER_NOT_FOUND]: 404,
  [AnimationErrorCode.PROVIDER_FAILED]: 500,
  [AnimationErrorCode.SANITIZATION_FAILED]: 422,
  [AnimationErrorCode.OPTIMIZATION_FAILED]: 422,
  [AnimationErrorCode.UNEXPECTED_ERROR]: 500
};

/**
 * API handler for animating SVG logos
 * 
 * This endpoint accepts an SVG and animation options, and returns the
 * animated SVG along with any necessary CSS or JS code.
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now().toString(36)}`;
  
  logger.info(`Processing animation request [${requestId}]`, {
    method: 'POST',
    path: '/api/animate-logo',
    requestId
  });
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn(`Invalid JSON in request body [${requestId}]`, {
        error: error instanceof Error ? error.message : 'Parse error',
        requestId
      });
      
      return NextResponse.json(
        { success: false, error: 'Invalid request format: Expected JSON' },
        { status: 400 }
      );
    }
    
    // Check for required SVG content
    if (!body.svg) {
      logger.warn(`Missing SVG content in request [${requestId}]`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing SVG content',
          details: 'The request must include an "svg" field with valid SVG content'
        },
        { status: 400 }
      );
    }
    
    // Validate SVG length
    if (typeof body.svg !== 'string' || body.svg.length > 1024 * 100) { // 100KB max
      logger.warn(`Invalid SVG content: too large or not a string [${requestId}]`, {
        contentType: typeof body.svg,
        contentLength: typeof body.svg === 'string' ? body.svg.length : 'N/A',
        requestId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid SVG content',
          details: 'SVG content must be a string less than 100KB'
        },
        { status: 400 }
      );
    }
    
    // Get animation options, with defaults if not provided
    const animationOptions: AnimationOptions = body.animationOptions || {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_OUT,
        delay: 0,
        iterations: 1
      }
    };
    
    // Validate animation type
    if (!Object.values(AnimationType).includes(animationOptions.type)) {
      logger.warn(`Invalid animation type [${requestId}]`, {
        type: animationOptions.type,
        requestId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid animation type',
          details: `Animation type must be one of: ${Object.values(AnimationType).join(', ')}`
        },
        { status: 400 }
      );
    }
    
    logger.info(`Animating SVG with type ${animationOptions.type} [${requestId}]`, {
      animationType: animationOptions.type,
      svgLength: body.svg.length,
      requestId
    });
    
    // Apply animation
    const result = await defaultAnimationService.animateSVG(body.svg, animationOptions);
    
    if (!result.success) {
      const errorCode = result.error?.code as AnimationErrorCode || AnimationErrorCode.UNEXPECTED_ERROR;
      const statusCode = errorToStatusCode[errorCode] || 500;
      
      logger.error(`Animation failed [${requestId}]`, {
        error: result.error,
        errorCode,
        statusCode,
        requestId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error?.message || 'Failed to animate SVG',
          details: result.error?.details,
          code: errorCode
        },
        { status: statusCode }
      );
    }
    
    // Return successful response with animated SVG and CSS/JS
    logger.info(`Animation successful [${requestId}]`, {
      processingTime: result.processingTime,
      animationType: animationOptions.type,
      requestId
    });
    
    return NextResponse.json({
      success: true,
      result: {
        animatedSvg: result.result?.animatedSvg,
        cssCode: result.result?.cssCode,
        jsCode: result.result?.jsCode,
        animationOptions: result.result?.animationOptions
      },
      processingTime: result.processingTime,
      requestId
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    logger.error(`Unexpected error in animation API [${requestId}]`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: AnimationErrorCode.UNEXPECTED_ERROR,
        requestId
      },
      { status: 500 }
    );
  }
}