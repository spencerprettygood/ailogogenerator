/**
 * Animation Service
 *
 * This module provides the main service for applying animations to SVG logos.
 * It coordinates between different animation providers and manages the animation process.
 *
 * Key responsibilities:
 * - Registering and managing animation providers
 * - Selecting the appropriate provider for a given animation type
 * - Applying animations to SVGs using the selected provider
 * - Handling errors and providing fallbacks
 * - Optimizing and sanitizing SVGs for animation
 * - Providing animation templates and presets
 */

import {
  AnimationProvider,
  AnimationType,
  AnimationOptions,
  AnimationResponse,
  AnimatedSVGLogo,
  AnimationEasing,
  AnimationTemplate,
  AnimationTrigger,
} from './types';
import { AnimationRegistry } from './animation-registry';
import { sanitizeSVG, validateSVG, extractAnimatableElements } from './utils';
// optimizeSVG is not exported directly from utils/index, use optimizeSVGFromSanitizer or optimizeSVGFromOptimizer if needed
import { Logger } from '../utils/logger';
import { withRetry } from '../retry';
import { CSSAnimationProvider } from './providers/css-provider';
import {
  handleError,
  withErrorHandling,
  ErrorCategory,
  ErrorSeverity,
  createAppError,
} from '../utils/error-handler';
import { createMemoizedFunction } from '../utils/cache-manager';
import { processSvgWithCache } from './svg-processing-pipeline';

/**
 * Default animation options used when specific options are not provided
 */
const DEFAULT_ANIMATION_OPTIONS: Partial<AnimationOptions> = {
  timing: {
    duration: 1000,
    delay: 0,
    easing: AnimationEasing.EASE_OUT,
    iterations: 1,
  },
};

/**
 * Error codes for animation failures
 */
export enum AnimationErrorCode {
  INVALID_INPUT = 'invalid_input',
  PROVIDER_NOT_FOUND = 'provider_not_found',
  PROVIDER_FAILED = 'provider_failed',
  SANITIZATION_FAILED = 'sanitization_failed',
  OPTIMIZATION_FAILED = 'optimization_failed',
  UNEXPECTED_ERROR = 'unexpected_error',
}

/**
 * Cache sizes for various operations
 */
const CACHE_SIZES = {
  PROVIDER_SELECTION: 50,
  FALLBACK_ANIMATION: 20,
  CSS_GENERATION: 30,
  OPTION_MERGING: 100,
};

/**
 * SVG Animation Service
 *
 * Main service for applying animations to SVG logos.
 */
export class SVGAnimationService {
  private registry: AnimationRegistry;
  private logger: Logger;
  private animationCache: Map<string, AnimationResponse>;

  // Memoized functions
  private memoizedGetProvider: (type: AnimationType) => AnimationProvider | undefined;
  private memoizedMergeOptions: (options: AnimationOptions) => AnimationOptions;
  private memoizedGenerateCss: {
    fadeIn: (animationId: string, options: AnimationOptions) => string;
    zoomIn: (animationId: string, options: AnimationOptions) => string;
    spin: (animationId: string, options: AnimationOptions) => string;
    pulse: (animationId: string, options: AnimationOptions) => string;
    default: (animationId: string, options: AnimationOptions) => string;
  };

  /**
   * Create a new SVGAnimationService
   */
  constructor() {
    this.registry = AnimationRegistry.getInstance();
    this.logger = new Logger('SVGAnimationService');
    this.animationCache = new Map();

    // Register default CSS animation provider
    this.registerProvider(new CSSAnimationProvider());

    // Initialize memoized functions
    this.memoizedGetProvider = createMemoizedFunction(this.getBestProviderForAnimation.bind(this), {
      maxSize: CACHE_SIZES.PROVIDER_SELECTION,
    });

    this.memoizedMergeOptions = createMemoizedFunction(this.mergeWithDefaultOptions.bind(this), {
      maxSize: CACHE_SIZES.OPTION_MERGING,
      getKey: options => `${options.type}:${JSON.stringify(options.timing || {})}`,
    });

    this.memoizedGenerateCss = {
      fadeIn: createMemoizedFunction(this.generateFadeInCss.bind(this), {
        maxSize: CACHE_SIZES.CSS_GENERATION,
      }),
      zoomIn: createMemoizedFunction(this.generateZoomInCss.bind(this), {
        maxSize: CACHE_SIZES.CSS_GENERATION,
      }),
      spin: createMemoizedFunction(this.generateSpinCss.bind(this), {
        maxSize: CACHE_SIZES.CSS_GENERATION,
      }),
      pulse: createMemoizedFunction(this.generatePulseCss.bind(this), {
        maxSize: CACHE_SIZES.CSS_GENERATION,
      }),
      default: createMemoizedFunction(this.generateDefaultCss.bind(this), {
        maxSize: CACHE_SIZES.CSS_GENERATION,
      }),
    };

    this.logger.info('SVG Animation Service initialized with default providers');
  }

  /**
   * Register an animation provider with the service
   *
   * @param provider - The animation provider to register
   */
  public registerProvider(provider: AnimationProvider): void {
    try {
      this.registry.registerProvider(provider);
      this.logger.info(`Provider registered: ${provider.id}`, {
        providerName: provider.name,
        supportedTypes: provider.supportedAnimationTypes,
      });
    } catch (error) {
      this.logger.error(`Failed to register provider: ${provider.id}`, {
        providerName: provider.name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all registered animation providers
   *
   * @returns Array of all registered providers
   */
  public getProviders(): AnimationProvider[] {
    const providers = this.registry.getAllProviders();
    this.logger.debug(`Retrieved ${providers.length} providers`);
    return providers;
  }

  /**
   * Generate a cache key for an animation request
   *
   * @param svg - The SVG content
   * @param options - Animation options
   * @returns A unique cache key for this animation request
   */
  private getCacheKey(svg: string, options: AnimationOptions): string {
    // Use first 40 chars + length + last 40 chars of SVG for a quick fingerprint
    const svgLength = svg.length;
    const svgFingerprint = `${svg.substring(0, 40)}:${svgLength}:${svg.substring(Math.max(0, svgLength - 40))}`;

    // Combine with animation type and timing settings for a unique key
    const optionsKey = `${options.type}:${options.timing?.duration || 0}:${options.timing?.easing || ''}`;

    return `${svgFingerprint}:${optionsKey}`;
  }

  /**
   * Animate an SVG with the specified animation options
   *
   * @param svg - The SVG content to animate
   * @param options - Animation options to apply
   * @returns Promise resolving to an AnimationResponse
   */
  public async animateSVG(svg: string, options: AnimationOptions): Promise<AnimationResponse> {
    // Use Date.now() for server compatibility instead of performance.now()
    const startTime = Date.now();
    const animationId = `anim_${Date.now().toString(36)}`;

    // Check cache for this exact animation request
    const cacheKey = this.getCacheKey(svg, options);
    if (this.animationCache.has(cacheKey)) {
      const cachedResult = this.animationCache.get(cacheKey)!;
      this.logger.info(`Retrieved animation from cache [${animationId}]`);

      // Clone the result to avoid modifying the cached version
      return {
        ...cachedResult,
        processingTime: 0, // Reset timing since we didn't actually process
        fromCache: true,
      };
    }

    this.logger.info(`Starting animation process [${animationId}]`, {
      animationType: options.type,
      animationId,
    });

    try {
      // Validate input
      if (!svg || svg.trim() === '') {
        this.logger.error(`Empty SVG content provided [${animationId}]`);
        return {
          success: false,
          error: {
            message: 'Empty SVG content provided',
            details: 'The SVG content must not be empty',
            code: AnimationErrorCode.INVALID_INPUT,
          },
          processingTime: Date.now() - startTime,
        };
      }

      // Use the improved SVG processing pipeline to handle validation, sanitization, and optimization
      const processingResult = processSvgWithCache(svg);

      // Check for validation errors
      if (!processingResult.validationResult.isValid) {
        this.logger.error(`Invalid SVG structure [${animationId}]`, {
          error: processingResult.validationResult.error,
          animationId,
        });
        return {
          success: false,
          error: {
            message: 'Invalid SVG structure',
            details:
              processingResult.validationResult.error ||
              'The SVG content is not properly structured',
            code: AnimationErrorCode.INVALID_INPUT,
          },
          processingTime: Date.now() - startTime,
        };
      }

      // Check for processing errors
      if (processingResult.error || !processingResult.optimizedSvg) {
        this.logger.error(`SVG processing failed [${animationId}]`, {
          error: processingResult.error,
          animationId,
        });
        return {
          success: false,
          error: {
            message: 'Failed to process SVG',
            details: processingResult.error || 'Unknown processing error',
            code: processingResult.error?.includes('sanitize')
              ? AnimationErrorCode.SANITIZATION_FAILED
              : AnimationErrorCode.OPTIMIZATION_FAILED,
          },
          processingTime: Date.now() - startTime,
        };
      }

      // Merge with default options using memoized function
      const mergedOptions = this.memoizedMergeOptions(options);

      // Use the optimized SVG from the processing pipeline
      const optimizedSVG = processingResult.optimizedSvg;

      // If we have animatable elements from the processing pipeline and options doesn't specify elements,
      // add them to the options for better targeting
      if (processingResult.animatableElements?.length && !mergedOptions.elements) {
        mergedOptions.elements = processingResult.animatableElements;
      }

      // Check animation compatibility if available
      if (
        processingResult.animationCompatibility &&
        processingResult.animationCompatibility[mergedOptions.type] &&
        !processingResult.animationCompatibility[mergedOptions.type].isCompatible
      ) {
        this.logger.warn(
          `Animation type ${mergedOptions.type} not compatible with this SVG [${animationId}]`,
          {
            reason: processingResult.animationCompatibility[mergedOptions.type].reason,
            animationId,
          }
        );
        // Continue anyway, but log the warning
      }

      // Get the best provider for this animation type using memoized function
      const provider = this.memoizedGetProvider(mergedOptions.type);

      if (!provider) {
        this.logger.warn(
          `No provider found for animation type: ${mergedOptions.type}, using fallback [${animationId}]`
        );

        // If no provider is available, use fallback implementation
        try {
          const fallbackResult = await this.applyFallbackAnimation(
            optimizedSVG,
            mergedOptions,
            animationId
          );

          this.logger.info(`Applied fallback animation successfully [${animationId}]`, {
            animationType: mergedOptions.type,
            processingTime: Date.now() - startTime,
            animationId,
          });

          const response: AnimationResponse = {
            success: true,
            result: fallbackResult,
            processingTime: Date.now() - startTime,
          };

          // Cache successful result
          this.animationCache.set(cacheKey, response);

          return response;
        } catch (error) {
          this.logger.error(`Fallback animation failed [${animationId}]`, {
            error: error instanceof Error ? error.message : String(error),
            animationId,
          });

          return {
            success: false,
            error: {
              message: 'Fallback animation failed',
              details: error instanceof Error ? error.message : String(error),
              code: AnimationErrorCode.UNEXPECTED_ERROR,
            },
            processingTime: Date.now() - startTime,
          };
        }
      }

      this.logger.info(
        `Using provider ${provider.id} for animation type ${mergedOptions.type} [${animationId}]`
      );

      // Apply animation using the selected provider with retry logic
      try {
        const animatedSVG = await withRetry(() => provider.animate(optimizedSVG, mergedOptions), {
          maxAttempts: 2,
          baseDelay: 500,
          backoffFactor: 1.5,
          maxDelay: 2000,
        });

        // Calculate processing time
        const processingTime = Date.now() - startTime;

        this.logger.info(`Animation completed successfully [${animationId}]`, {
          animationType: mergedOptions.type,
          provider: provider.id,
          processingTime,
          animationId,
        });

        const response: AnimationResponse = {
          success: true,
          result: animatedSVG,
          processingTime,
        };

        // Cache successful result
        this.animationCache.set(cacheKey, response);

        return response;
      } catch (error) {
        this.logger.error(`Provider ${provider.id} failed to apply animation [${animationId}]`, {
          error: error instanceof Error ? error.message : String(error),
          provider: provider.id,
          animationType: mergedOptions.type,
          animationId,
        });

        return {
          success: false,
          error: {
            message: `Provider ${provider.id} failed to apply animation`,
            details: error instanceof Error ? error.message : String(error),
            code: AnimationErrorCode.PROVIDER_FAILED,
          },
          processingTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unexpected error during animation process [${animationId}]`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        animationType: options.type,
        animationId,
      });

      return {
        success: false,
        error: {
          message: 'Failed to animate SVG due to an unexpected error',
          details: errorMessage,
          code: AnimationErrorCode.UNEXPECTED_ERROR,
        },
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Clear the animation cache or remove specific entries
   *
   * @param cacheKey - Optional specific cache key to remove, if not provided clears entire cache
   * @param clearProcessingCache - Whether to also clear the SVG processing caches (default: false)
   */
  public clearCache(cacheKey?: string, clearProcessingCache: boolean = false): void {
    if (cacheKey) {
      this.animationCache.delete(cacheKey);
      this.logger.debug(`Removed specific animation from cache: ${cacheKey}`);
    } else {
      this.animationCache.clear();
      this.logger.info('Cleared entire animation cache');

      // Also clear SVG processing caches if requested
      if (clearProcessingCache) {
        // Import dynamically to avoid circular dependency
        import('./svg-processing-pipeline').then(pipeline => {
          pipeline.clearSvgProcessingCaches();
          this.logger.info('Cleared SVG processing caches');
        });
      }
    }
  }

  /**
   * Get the best provider for the specified animation type
   *
   * @param animationType - The animation type to find a provider for
   * @returns The best provider for the animation type, or undefined if none found
   */
  private getBestProviderForAnimation(animationType: AnimationType): AnimationProvider | undefined {
    const provider = this.registry.getBestProviderForType(animationType);

    if (provider) {
      this.logger.debug(`Selected provider ${provider.id} for animation type ${animationType}`);
    } else {
      this.logger.debug(`No provider found for animation type ${animationType}`);
    }

    return provider;
  }

  /**
   * Apply a fallback animation when no provider is available
   *
   * @param svg - The SVG content to animate
   * @param options - Animation options to apply
   * @param animationId - Unique identifier for this animation operation
   * @returns Promise resolving to an AnimatedSVGLogo
   */
  private async applyFallbackAnimation(
    svg: string,
    options: AnimationOptions,
    animationId: string
  ): Promise<AnimatedSVGLogo> {
    this.logger.info(`Applying fallback animation for type: ${options.type} [${animationId}]`);

    // Basic CSS animation as fallback
    const cssAnimationId = `anim_${Math.random().toString(36).slice(2, 11)}`;
    let cssCode = '';
    let animatedSvg = svg;

    // Extract the root SVG element
    const svgMatch = svg.match(/<svg[^>]*>/);
    if (!svgMatch) {
      this.logger.error(`Invalid SVG: No SVG element found in fallback animation [${animationId}]`);
      throw new Error('Invalid SVG: No SVG element found');
    }

    try {
      const svgOpen = svgMatch[0];
      const svgWithClass = svgOpen.replace(/(<svg[^>]*)>/, `$1 class="${cssAnimationId}">`);
      animatedSvg = svg.replace(svgOpen, svgWithClass);

      this.logger.debug(`Added animation class ${cssAnimationId} to SVG [${animationId}]`);

      // Generate basic CSS based on animation type using memoized functions
      switch (options.type) {
        case AnimationType.FADE_IN:
          cssCode = this.memoizedGenerateCss.fadeIn(cssAnimationId, options);
          break;

        case AnimationType.ZOOM_IN:
          cssCode = this.memoizedGenerateCss.zoomIn(cssAnimationId, options);
          break;

        case AnimationType.SPIN:
          cssCode = this.memoizedGenerateCss.spin(cssAnimationId, options);
          break;

        case AnimationType.PULSE:
          cssCode = this.memoizedGenerateCss.pulse(cssAnimationId, options);
          break;

        default:
          // Default to fade-in for unsupported types
          this.logger.debug(
            `Using default fade-in for unsupported type ${options.type} [${animationId}]`
          );
          cssCode = this.memoizedGenerateCss.default(cssAnimationId, options);
          break;
      }

      this.logger.debug(`Generated CSS for fallback animation [${animationId}]`);

      return {
        originalSvg: svg,
        animatedSvg,
        cssCode,
        animationOptions: options,
      };
    } catch (error) {
      this.logger.error(`Error in fallback animation generation [${animationId}]`, {
        error: error instanceof Error ? error.message : String(error),
        animationType: options.type,
        animationId,
      });
      throw error;
    }
  }

  /**
   * Generate CSS for fade-in animation
   */
  private generateFadeInCss(animationId: string, options: AnimationOptions): string {
    return `
      @keyframes ${animationId}_fade_in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .${animationId} {
        opacity: 0;
        animation: ${animationId}_fade_in ${options.timing.duration}ms ${options.timing.easing || 'ease-out'};
        animation-fill-mode: forwards;
        animation-delay: ${options.timing.delay || 0}ms;
        will-change: opacity;
        transform: translateZ(0);
      }
    `;
  }

  /**
   * Generate CSS for zoom-in animation
   */
  private generateZoomInCss(animationId: string, options: AnimationOptions): string {
    return `
      @keyframes ${animationId}_zoom_in {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .${animationId} {
        opacity: 0;
        transform-origin: center center;
        animation: ${animationId}_zoom_in ${options.timing.duration}ms ${options.timing.easing || 'ease-out'};
        animation-fill-mode: forwards;
        animation-delay: ${options.timing.delay || 0}ms;
        will-change: transform, opacity;
        transform: translateZ(0);
      }
    `;
  }

  /**
   * Generate CSS for spin animation
   */
  private generateSpinCss(animationId: string, options: AnimationOptions): string {
    return `
      @keyframes ${animationId}_spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .${animationId} {
        transform-origin: center center;
        animation: ${animationId}_spin ${options.timing.duration}ms ${options.timing.easing || 'linear'};
        animation-fill-mode: forwards;
        animation-delay: ${options.timing.delay || 0}ms;
        animation-iteration-count: ${options.timing.iterations || 1};
        will-change: transform;
        transform: translateZ(0);
      }
    `;
  }

  /**
   * Generate CSS for pulse animation
   */
  private generatePulseCss(animationId: string, options: AnimationOptions): string {
    const iterationCount =
      typeof options.timing.iterations === 'number'
        ? options.timing.iterations === Infinity
          ? 'infinite'
          : options.timing.iterations
        : 'infinite';
    return `
      @keyframes ${animationId}_pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      .${animationId} {
        transform-origin: center center;
        animation: ${animationId}_pulse ${options.timing.duration}ms ${options.timing.easing || 'ease-in-out'};
        animation-fill-mode: forwards;
        animation-delay: ${options.timing.delay || 0}ms;
        animation-iteration-count: ${iterationCount};
        will-change: transform;
        transform: translateZ(0);
      }
    `;
  }

  /**
   * Generate CSS for default animation (fade-in)
   */
  private generateDefaultCss(animationId: string, options: AnimationOptions): string {
    return `
      @keyframes ${animationId}_default {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .${animationId} {
        opacity: 0;
        animation: ${animationId}_default ${options.timing.duration}ms ${options.timing.easing || 'ease-out'};
        animation-fill-mode: forwards;
        animation-delay: ${options.timing.delay || 0}ms;
        will-change: opacity;
        transform: translateZ(0);
      }
    `;
  }

  /**
   * Merge provided animation options with defaults
   *
   * @param options - The animation options to merge
   * @returns Complete animation options with defaults applied
   */
  private mergeWithDefaultOptions(options: AnimationOptions): AnimationOptions {
    return {
      ...DEFAULT_ANIMATION_OPTIONS,
      ...options,
      timing: {
        ...DEFAULT_ANIMATION_OPTIONS.timing,
        ...options.timing,
      },
    } as AnimationOptions;
  }
}

/**
 * Create a singleton instance for static access
 */
const svgAnimationServiceInstance = new SVGAnimationService();
export { svgAnimationServiceInstance as svgAnimationService };

/**
 * Pre-defined animation templates for common animation effects
 */
export const animationTemplates: AnimationTemplate[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'Gradually increases opacity from transparent to fully visible',
    previewUrl: '/assets/animations/fade-in.gif',
    defaultOptions: {
      type: AnimationType.FADE_IN,
      timing: {
        duration: 1000,
        delay: 0,
        easing: AnimationEasing.EASE_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/fade-in.png',
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Scales up from a smaller size while fading in',
    previewUrl: '/assets/animations/zoom-in.gif',
    defaultOptions: {
      type: AnimationType.ZOOM_IN,
      timing: {
        duration: 1200,
        delay: 0,
        easing: AnimationEasing.EASE_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/zoom-in.png',
  },
  {
    id: 'draw',
    name: 'Draw',
    description: 'Simulates drawing the logo one stroke at a time',
    previewUrl: '/assets/animations/draw.gif',
    defaultOptions: {
      type: AnimationType.DRAW,
      timing: {
        duration: 2000,
        delay: 0,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: false,
    compatibleWithText: false,
    thumbnailUrl: '/assets/animations/thumbnails/draw.png',
  },
  {
    id: 'spin',
    name: 'Spin',
    description: 'Rotates the logo around its center',
    previewUrl: '/assets/animations/spin.gif',
    defaultOptions: {
      type: AnimationType.SPIN,
      timing: {
        duration: 1500,
        delay: 0,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/spin.png',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Gentle pulsing effect that draws attention',
    previewUrl: '/assets/animations/pulse.gif',
    defaultOptions: {
      type: AnimationType.PULSE,
      timing: {
        duration: 1500,
        delay: 0,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: Infinity,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/pulse.png',
  },
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Playful bouncing motion',
    previewUrl: '/assets/animations/bounce.gif',
    defaultOptions: {
      type: AnimationType.BOUNCE,
      timing: {
        duration: 1000,
        delay: 0,
        easing: AnimationEasing.BOUNCE,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/bounce.png',
  },
  {
    id: 'sequential',
    name: 'Sequential',
    description: 'Elements appear one after another',
    previewUrl: '/assets/animations/sequential.gif',
    defaultOptions: {
      type: AnimationType.SEQUENTIAL,
      timing: {
        duration: 500,
        delay: 0,
        easing: AnimationEasing.EASE_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
      stagger: 150,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/sequential.png',
  },
  {
    id: 'morph',
    name: 'Morph',
    description: 'Shape transformation effect',
    previewUrl: '/assets/animations/morph.gif',
    defaultOptions: {
      type: AnimationType.MORPH,
      timing: {
        duration: 1800,
        delay: 0,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.LOAD,
    },
    compatibleWithLayers: false,
    compatibleWithText: false,
    thumbnailUrl: '/assets/animations/thumbnails/morph.png',
  },
  {
    id: 'hover-pulse',
    name: 'Hover Pulse',
    description: 'Pulse effect when hovering over the logo',
    previewUrl: '/assets/animations/hover-pulse.gif',
    defaultOptions: {
      type: AnimationType.PULSE,
      timing: {
        duration: 800,
        delay: 0,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: Infinity,
      },
      trigger: AnimationTrigger.HOVER,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/hover-pulse.png',
  },
  {
    id: 'click-spin',
    name: 'Click Spin',
    description: 'Spins once when clicked',
    previewUrl: '/assets/animations/click-spin.gif',
    defaultOptions: {
      type: AnimationType.SPIN,
      timing: {
        duration: 1000,
        delay: 0,
        easing: AnimationEasing.EASE_IN_OUT,
        iterations: 1,
      },
      trigger: AnimationTrigger.CLICK,
    },
    compatibleWithLayers: true,
    compatibleWithText: true,
    thumbnailUrl: '/assets/animations/thumbnails/click-spin.png',
  },
];
