/**
 * Mockup Performance Optimizer
 *
 * Provides performance optimizations for enhanced mockup rendering
 */

import { EnhancedEffectsConfig } from './mockup-types';

/**
 * Detects browser/device capabilities to determine optimal rendering settings
 */
export function detectDeviceCapabilities(): {
  supportsComplexEffects: boolean;
  supportsHighResolution: boolean;
  memoryConstrained: boolean;
  recommendedQuality: 'low' | 'medium' | 'high';
} {
  // In a real implementation, this would detect actual device capabilities
  // For now, we'll use a simplified version that checks for basic indicators

  const isMobile =
    typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const isOldBrowser =
    typeof window !== 'undefined' && /MSIE|Trident|Edge\/1[0-5]/i.test(navigator.userAgent);

  // Check for high-DPI displays
  const isHighDPI = typeof window !== 'undefined' && window.devicePixelRatio > 1.5;

  // Determine if this is likely a memory-constrained device
  const memoryConstrained = isMobile || isOldBrowser;

  // Determine optimal quality setting based on device capabilities
  let recommendedQuality: 'low' | 'medium' | 'high' = 'medium';

  if (memoryConstrained) {
    recommendedQuality = 'low';
  } else if (isHighDPI && !memoryConstrained) {
    recommendedQuality = 'high';
  }

  return {
    supportsComplexEffects: !isOldBrowser && !isMobile,
    supportsHighResolution: isHighDPI && !memoryConstrained,
    memoryConstrained,
    recommendedQuality,
  };
}

/**
 * Optimizes effects configuration based on device capabilities
 */
export function getOptimizedEffectsConfig(
  userConfig: EnhancedEffectsConfig
): EnhancedEffectsConfig {
  const capabilities = detectDeviceCapabilities();

  // For low-end devices, reduce complexity
  if (capabilities.memoryConstrained) {
    return {
      ...userConfig,
      applyLighting: userConfig.applyLighting && !capabilities.memoryConstrained,
      lightIntensity: userConfig.lightIntensity * 0.7, // Reduce intensity for better performance
      applyPerspective: userConfig.applyPerspective && !capabilities.memoryConstrained,
      applyShadow: userConfig.applyShadow,
      shadowBlur: Math.min(userConfig.shadowBlur, 5), // Limit blur radius for better performance
      shadowOpacity: userConfig.shadowOpacity,
    };
  }

  // For high-end devices, we can use the full configuration
  return userConfig;
}

/**
 * Optimizes the SVG code for better rendering performance
 */
export function optimizeSvgForRendering(svgCode: string): string {
  // In a real implementation, you would use a proper SVG optimizer
  // For now, we'll do some basic optimizations
  return svgCode.replace(/<!--.*?-->/gs, '').replace(/\s+/g, ' ');
}

/**
 * Generates optimal image dimensions based on device capabilities and target display size
 */
export function getOptimalImageDimensions(
  targetWidth: number,
  targetHeight: number
): { width: number; height: number } {
  const capabilities = detectDeviceCapabilities();

  // For high-DPI displays, increase resolution
  if (capabilities.supportsHighResolution) {
    return {
      width: Math.min(targetWidth * 2, 2000), // Cap at 2000px
      height: Math.min(targetHeight * 2, 1500), // Cap at 1500px
    };
  }

  // For memory-constrained devices, decrease resolution
  if (capabilities.memoryConstrained) {
    return {
      width: Math.min(targetWidth * 0.8, 800), // Lower resolution
      height: Math.min(targetHeight * 0.8, 600), // Lower resolution
    };
  }

  // Default dimensions
  return {
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Optimizes the background image for rendering
 * In a real implementation, this would include responsive image selection,
 * compression settings, and proper sizing
 */
export function getOptimizedBackgroundUrl(
  originalUrl: string,
  width: number,
  height: number
): string {
  const capabilities = detectDeviceCapabilities();

  // Extract the base path and extension
  const basePath = originalUrl.replace(/\.(jpg|jpeg|png|webp)$/, '');
  const extension = originalUrl.match(/\.(jpg|jpeg|png|webp)$/)?.[1] || 'jpg';

  // For memory-constrained devices, use smaller images
  if (capabilities.memoryConstrained) {
    return `${basePath}-small.${extension}`;
  }

  // For high-resolution displays, use higher quality images
  if (capabilities.supportsHighResolution) {
    return `${basePath}-2x.${extension}`;
  }

  // Default to the original URL
  return originalUrl;
}

/**
 * Reduces complexity of SVG effects for better performance
 */
export function simplifyEffects(svgCode: string): string {
  const capabilities = detectDeviceCapabilities();

  if (capabilities.memoryConstrained) {
    // Simplify or remove complex filters
    return (
      svgCode
        // Replace complex gaussian blur filters with simpler ones
        .replace(/<feGaussianBlur[^>]*stdDeviation=['"]([^'"]*)['"]/g, (match, stdDev) => {
          const newStdDev = Math.min(parseFloat(stdDev), 3);
          return match.replace(stdDev, newStdDev.toString());
        })
        // Simplify complex filter chains
        .replace(/<filter[^>]*>[\s\S]*?<\/filter>/g, filter => {
          // Count filter primitives
          const primitiveCount = (filter.match(/<fe[A-Z][^>]*>/g) || []).length;

          // If the filter has more than 3 primitives, try to simplify it
          if (primitiveCount > 3) {
            // This is a simplified version - in real implementation,
            // you would analyze the filter chain and optimize it properly
            return filter
              .replace(/<feComposite[^>]*>[\s\S]*?<\/feComposite>/g, '')
              .replace(/<feComponentTransfer[^>]*>[\s\S]*?<\/feComponentTransfer>/g, '');
          }

          return filter;
        })
    );
  }

  // Return the original SVG code for capable devices
  return svgCode;
}

/**
 * Determines if we should use WebP format for better performance
 */
export function shouldUseWebP(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for WebP support
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  return false;
}
