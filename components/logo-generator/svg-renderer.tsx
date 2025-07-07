'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';
import { processSVGForDisplay, sanitizeSVG } from '@/lib/utils/svg-sanitizer';

export interface SVGRendererProps {
  /** SVG content as a string */
  svgContent: string;
  /** CSS animation code to apply */
  animationCSS?: string;
  /** Whether the animation should be playing */
  isPlaying?: boolean;
  /** Background color or class */
  background?: string;
  /** Additional class names */
  className?: string;
  /** Zoom level (1 = 100%) */
  zoom?: number;
  /** Position offset */
  position?: { x: number; y: number };
  /** Whether the SVG should be draggable */
  draggable?: boolean;
  /** Event handler when SVG is clicked */
  onClick?: () => void;
  /** Event handler when dragging starts */
  onDragStart?: () => void;
  /** Event handler when dragging ends */
  onDragEnd?: () => void;
  /** Optional aspect ratio to maintain */
  aspectRatio?: string;
  /** Whether to show a transparent grid background */
  showGrid?: boolean;
  /** ARIA hidden attribute */
  ariaHidden?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** The description ID for the SVG (for ARIA describedby) */
  ariaDescribedBy?: string;
  /** Optional title for the SVG */
  title?: string;
  /** Optional description for the SVG */
  description?: string;
  /** Whether to optimize the SVG for performance */
  optimize?: boolean;
  /** Whether to skip sanitization (use with caution) */
  skipSanitization?: boolean;
  /** An ID for the container */
  id?: string;
  /** A fallback element to display if SVG rendering fails */
  fallback?: React.ReactNode;
}

/**
 * Enhanced SVG Renderer Component
 *
 * A high-performance component for rendering SVG content with support for:
 * - Security-focused SVG sanitization to prevent XSS attacks
 * - Animations with play/pause controls
 * - Zoom and pan interactions
 * - Background customization with grid support
 * - Accessibility features
 * - Error boundaries and fallbacks
 * - Performance optimizations
 */
export function SVGRenderer({
  svgContent,
  animationCSS,
  isPlaying = true,
  background,
  className,
  zoom = 1,
  position = { x: 0, y: 0 },
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  aspectRatio = '1/1',
  showGrid = false,
  ariaHidden = false,
  ariaLabel,
  ariaDescribedBy,
  title,
  description,
  optimize = true,
  skipSanitization = false,
  id = `svg-renderer-${Math.random().toString(36).slice(2, 7)}`,
  fallback,
}: SVGRendererProps) {
  // Refs
  const svgRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // State
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // CSS Style Element ID for animations - using a consistent ID improves performance by avoiding style repaints
  const styleId = useMemo(() => `svg-style-${id}`, [id]);

  // Generate a stable container ID
  const containerId = useMemo(() => `svg-container-${id}`, [id]);

  // Parse and sanitize SVG content
  const processedSvgContent = useMemo(() => {
    try {
      if (!svgContent) {
        return '';
      }

      // First apply security-focused sanitization unless explicitly skipped
      // (skipSanitization should only be used for trusted content)
      let sanitizedContent = svgContent;
      if (!skipSanitization) {
        const processed = processSVGForDisplay(svgContent);

        if (!processed.isValid) {
          throw new Error(processed.error || 'Invalid SVG content');
        }

        sanitizedContent = processed.sanitized;
      }

      // Only optimize if requested
      if (!optimize) {
        return sanitizedContent;
      }

      // Create a DOMParser to safely parse the SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(sanitizedContent, 'image/svg+xml');

      // Check for parsing errors
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('SVG parsing error: ' + parserError.textContent);
      }

      // Get the SVG element
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        throw new Error('No SVG element found in the content');
      }

      // Add title and description for accessibility if provided
      if (title) {
        // Check if a title element already exists
        let titleElement = svgElement.querySelector('title');
        if (!titleElement) {
          titleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'title');
          svgElement.insertBefore(titleElement, svgElement.firstChild);
        }
        titleElement.textContent = title;
      }

      if (description) {
        // Check if a desc element already exists
        let descElement = svgElement.querySelector('desc');
        if (!descElement) {
          descElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'desc');
          // Insert after title or as first child
          if (svgElement.querySelector('title')) {
            svgElement.insertBefore(descElement, svgElement.querySelector('title')!.nextSibling);
          } else {
            svgElement.insertBefore(descElement, svgElement.firstChild);
          }
        }
        descElement.textContent = description;
      }

      // Add role="img" for better accessibility
      svgElement.setAttribute('role', 'img');

      // Set aria attributes
      if (ariaLabel) {
        svgElement.setAttribute('aria-label', ariaLabel);
      }

      if (ariaDescribedBy) {
        svgElement.setAttribute('aria-describedby', ariaDescribedBy);
      }

      // Set aria-hidden if needed
      if (ariaHidden) {
        svgElement.setAttribute('aria-hidden', 'true');
      }

      // Add unique ID to the SVG if it doesn't have one
      if (!svgElement.hasAttribute('id')) {
        svgElement.setAttribute('id', `svg-element-${id}`);
      }

      // Serialize back to string
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgDoc);
    } catch (error) {
      // Handle SVG processing error
      handleError(error, {
        category: ErrorCategory.SVG,
        context: {
          component: 'SVGRenderer',
          operation: 'processSvgContent',
        },
        logLevel: 'error',
      });

      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown SVG processing error');

      // Return a safe fallback SVG in case of error
      return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <title>Error loading SVG</title>
        <rect width="100" height="100" fill="#f8f8f8" />
        <text x="50" y="50" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#ff4233">Error</text>
      </svg>`;
    }
  }, [
    svgContent,
    optimize,
    skipSanitization,
    id,
    title,
    description,
    ariaLabel,
    ariaDescribedBy,
    ariaHidden,
  ]);

  // Extract SVG dimensions from the SVG content
  const extractSvgDimensions = useCallback(() => {
    if (!svgContent || typeof window === 'undefined') return;

    let tempDiv: HTMLDivElement | null = null;

    try {
      // Create a temporary div to parse the SVG
      tempDiv = document.createElement('div');
      // Use sanitized SVG to prevent XSS during dimension extraction
      tempDiv.innerHTML = !skipSanitization ? sanitizeSVG(svgContent) : svgContent;
      const svgElement = tempDiv.querySelector('svg');

      if (svgElement) {
        // Get the viewBox
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const viewBoxParts = viewBox.split(/[\s,]+/).map(Number);
          if (viewBoxParts.length >= 4) {
            const [, , width, height] = viewBoxParts;
            if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
              setSvgDimensions({ width, height });
              return;
            }
          }
        }

        // If no valid viewBox, try width and height attributes
        if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
          const width = parseFloat(svgElement.getAttribute('width') || '0');
          const height = parseFloat(svgElement.getAttribute('height') || '0');

          // Handle percentage values by converting to 100
          const widthIsPercent = svgElement.getAttribute('width')?.includes('%') || false;
          const heightIsPercent = svgElement.getAttribute('height')?.includes('%') || false;

          const finalWidth = widthIsPercent ? 100 : width;
          const finalHeight = heightIsPercent ? 100 : height;

          if (finalWidth > 0 && finalHeight > 0) {
            setSvgDimensions({ width: finalWidth, height: finalHeight });
            return;
          }
        }

        // Fallback to default dimensions if nothing is specified
        setSvgDimensions({ width: 100, height: 100 });
      }
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.SVG,
        context: {
          component: 'SVGRenderer',
          operation: 'extractSvgDimensions',
        },
        logLevel: 'warn',
      });

      // Use default dimensions in case of error
      setSvgDimensions({ width: 100, height: 100 });
    } finally {
      // Clean up DOM elements to prevent memory leaks
      if (tempDiv) {
        tempDiv.innerHTML = '';
        tempDiv = null;
      }
    }
  }, [svgContent, skipSanitization]);

  // Extract dimensions on mount and when SVG content changes
  useEffect(() => {
    extractSvgDimensions();
  }, [extractSvgDimensions]);

  // Handle animation CSS
  useEffect(() => {
    // Skip if no animation CSS provided or not in browser
    if (!animationCSS || typeof window === 'undefined') return;

    try {
      // Check if style element already exists
      if (!styleRef.current) {
        // Create a style element for animations
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
        styleRef.current = styleElement;
      }

      // Update the style content
      if (styleRef.current) {
        styleRef.current.textContent = animationCSS;
      }
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.SVG,
        context: {
          component: 'SVGRenderer',
          operation: 'applyAnimationCSS',
        },
        logLevel: 'warn',
      });
    }

    // Clean up function to remove the style element when unmounting
    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [animationCSS, styleId]);

  // Handle SVG load success
  useEffect(() => {
    if (svgRef.current && processedSvgContent && !hasError) {
      setIsLoaded(true);
    }
  }, [processedSvgContent, hasError]);

  // Create animation class based on playback state
  const animationClass = isPlaying ? 'animate-running' : 'animate-paused';

  // Determine if background is a CSS class or a color value
  const isBackgroundClass = background?.startsWith('bg-');
  const backgroundClass = isBackgroundClass ? background : '';
  const backgroundStyle = isBackgroundClass ? {} : { backgroundColor: background };

  // Handle background and grid
  const gridClass = showGrid ? 'bg-grid' : '';

  // Calculate aspect ratio based on SVG dimensions if not provided
  const effectiveAspectRatio = useMemo(() => {
    if (aspectRatio !== 'auto') return aspectRatio;

    if (svgDimensions.width > 0 && svgDimensions.height > 0) {
      return `${svgDimensions.width} / ${svgDimensions.height}`;
    }

    return '1 / 1'; // Default fallback
  }, [aspectRatio, svgDimensions]);

  // If there's an error and fallback is provided, render the fallback
  if (hasError && fallback) {
    return (
      <div
        id={containerId}
        className={className}
        role="img"
        aria-label={ariaLabel || 'SVG rendering error'}
      >
        {fallback}
        {errorMessage && (
          <div className="text-destructive text-xs mt-2" aria-live="polite">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  // Render the SVG with enhanced performance and accessibility
  return (
    <div
      id={containerId}
      className={cn(
        'relative overflow-hidden',
        backgroundClass,
        gridClass,
        draggable ? 'cursor-grab active:cursor-grabbing' : '',
        className
      )}
      style={{
        ...backgroundStyle,
        aspectRatio: effectiveAspectRatio,
      }}
      onClick={onClick}
      role="presentation"
      aria-hidden={ariaHidden}
    >
      {/* SVG content with zoom and position */}
      <div
        ref={svgRef}
        className={cn(
          'absolute top-1/2 left-1/2 transform',
          animationClass,
          isLoaded ? 'opacity-100' : 'opacity-0', // Fade in when loaded
          'transition-opacity duration-200'
        )}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
          willChange: draggable ? 'transform' : 'auto', // Performance optimization for smoother dragging
        }}
        aria-busy={!isLoaded}
        dangerouslySetInnerHTML={{ __html: processedSvgContent }}
      />

      {/* Loading indicator - shows only while SVG is loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}
    </div>
  );
}

export default SVGRenderer;
