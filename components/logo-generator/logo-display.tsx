"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AnimationType } from "@/lib/animation/types";
import { useThemeSafe } from "@/components/providers/theme-fixed";
import { SVGLogo } from "@/lib/types";
import { SVGRenderer } from "./svg-renderer";
import { cn } from "@/lib/utils";
import { ErrorCategory, handleError } from "@/lib/utils/error-handler";
import { Paragraph } from "@/components/ui/typography";

// Define missing types locally for now
interface LogoVariant {
  id: string;
  name?: string;
  type?: string;
  svgCode: string;
  colorScheme?: string[];
}

interface AnimatedLogo {
  id: string;
  svgCode: string;
  animationCSS?: string;
  cssCode?: string;
  duration?: number;
}

export interface LogoDisplayProps {
  /** Primary SVG logo */
  logo?: SVGLogo;
  /** SVG content as a string (alternative to logo) */
  svgContent?: string;
  /** SVG code as a string (alias for svgContent for compatibility) */
  svgCode?: string;
  /** Available logo variants */
  variants?: LogoVariant[];
  /** CSS animation to apply to the SVG */
  animationCSS?: string;
  /** Selected animation type */
  animationType?: AnimationType;
  /** Animated logo object (alternative to animationCSS) */
  animatedLogo?: AnimatedLogo;
  /** Whether the logo is being generated */
  isGenerating?: boolean;
  /** Whether the generation failed */
  hasError?: boolean;
  /** Optional error message */
  errorMessage?: string;
  /** Optional title for the logo */
  title?: string;
  /** Optional subtitle or description */
  description?: string;
  /** Allow downloading the SVG */
  allowDownload?: boolean;
  /** Show animation controls */
  showAnimationControls?: boolean;
  /** Additional class name */
  className?: string;
  /** Callback when animation state changes */
  onAnimationStateChange?: (isPlaying: boolean) => void;
  /** Callback when a variant is selected */
  onVariantSelect?: (variantId: string) => void;
  /** Callback when user requests to customize the logo */
  onCustomizeRequest?: (svgContent: string) => void;
  /** Identifier for the logo, used for ARIA labels and accessibility */
  id?: string;
}

/** 
 * Logo Display Component
 * 
 * Displays the generated SVG logo with controls for preview, animation, and customization.
 * Enhanced with keyboard navigation, a11y improvements, and advanced error handling.
 */
function LogoDisplay({
  logo,
  svgContent = "",
  svgCode = "",
  variants = [],
  animationCSS = "",
  animationType,
  animatedLogo,
  isGenerating = false,
  hasError = false,
  errorMessage = "Failed to generate logo",
  title,
  description,
  allowDownload = true,
  showAnimationControls = true,
  className,
  onAnimationStateChange,
  onVariantSelect,
  onCustomizeRequest,
  id = "logo-display",
}: LogoDisplayProps) {
  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 && variants[0]?.id ? variants[0].id : null
  );
  
  // State for SVG content validation
  const [isSvgValid, setIsSvgValid] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Theme - with safe fallback
  const { isDark } = useThemeSafe();
  
  // Background options with CSS classes - enhanced with semantic naming
  const backgrounds = [
    { name: "Light", value: "bg-white", description: "White background" },
    { name: "Dark", value: "bg-gray-900", description: "Dark background" },
    { name: "Transparent", value: "bg-transparent", description: "Transparent background with grid" },
    { name: "Accent", value: "bg-accent/10", description: "Accent color background" },
    { name: "Blue", value: "bg-blue-100 dark:bg-blue-900", description: "Blue background" },
    { name: "Green", value: "bg-green-100 dark:bg-green-900", description: "Green background" },
  ];
  
  // Helper function to validate SVG content
  const validateSvgContent = useCallback((content: string): boolean => {
    try {
      if (!content) return false;
      
      // Basic check for SVG tags
      if (!content.includes('<svg') || !content.includes('</svg>')) {
        setValidationError("Invalid SVG format: Missing SVG tags");
        return false;
      }
      
      // Create a DOM parser to validate XML structure
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(content, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        setValidationError("SVG parsing error: Malformed XML");
        return false;
      }
      
      // Validate that root element is SVG
      const rootElement = svgDoc.documentElement;
      if (rootElement.nodeName !== 'svg') {
        setValidationError("Invalid SVG: Root element is not <svg>");
        return false;
      }
      
      // Successfully validated
      setValidationError(null);
      return true;
    } catch (error) {
      // Handle any unexpected errors during validation
      handleError(error, {
        category: ErrorCategory.SVG,
        context: {
          component: 'LogoDisplay',
          operation: 'validateSvgContent'
        },
        logLevel: 'warn'
      });
      
      setValidationError("SVG validation error: " + (error instanceof Error ? error.message : "Unknown error"));
      return false;
    }
  }, []);
  
  // Determine the SVG content to display
  const displaySvgContent = React.useMemo(() => {
    let finalSvgContent = "";
    
    try {
      // If a specific variant is selected, use its SVG
      if (selectedVariantId && variants.length > 0) {
        const selectedVariant = variants.find(v => v.id === selectedVariantId);
        if (selectedVariant?.svgCode) {
          finalSvgContent = selectedVariant.svgCode;
        }
      }
      
      // Otherwise use the logo SVG or provided SVG content
      if (!finalSvgContent && logo?.svgCode) {
        finalSvgContent = logo.svgCode;
      }
      
      // Handle both svgContent and svgCode for compatibility
      if (!finalSvgContent && svgContent) {
        // Check if the content might be from AI SDK v5 format (contains an SVG tag)
        if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
          // Extract SVG content using regex for safety
          const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
          if (svgMatch) {
            finalSvgContent = svgMatch[0];
          } else {
            finalSvgContent = svgContent;
          }
        } else {
          finalSvgContent = svgContent;
        }
      }
      
      // Fall back to svgCode
      if (!finalSvgContent && svgCode) {
        finalSvgContent = svgCode;
      }
      
      // Validate the final SVG content
      const isValid = validateSvgContent(finalSvgContent);
      setIsSvgValid(isValid);
      
      return finalSvgContent;
    } catch (error) {
      // Handle any unexpected errors
      handleError(error, {
        category: ErrorCategory.SVG,
        context: {
          component: 'LogoDisplay',
          operation: 'displaySvgContent'
        },
        logLevel: 'warn'
      });
      
      setIsSvgValid(false);
      setValidationError("Error processing SVG content");
      return "";
    }
  }, [logo, svgContent, svgCode, selectedVariantId, variants, validateSvgContent]);
  
  // Handle animation playback
  useEffect(() => {
    if (onAnimationStateChange) {
      onAnimationStateChange(isPlaying);
    }
  }, [isPlaying, onAnimationStateChange]);
  
  // Reset zoom and position when new SVG is received
  useEffect(() => {
    if (displaySvgContent) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [displaySvgContent]);
  
  // Handle mousedown for drag operations
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  // Handle touchstart for drag operations on mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    if (!touch) return;

    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };
  
  // Handle mousemove for drag operations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  // Handle touchmove for drag operations on mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    if (!touch) return;

    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
    
    // Prevent page scrolling while dragging
    e.preventDefault();
  };
  
  // Handle mouseup/touchend to end drag operations
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Handle zoom in/out
  const handleZoom = useCallback((delta: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.max(0.5, Math.min(3, prevZoom + delta));
      return newZoom;
    });
  }, []);
  
  // Reset zoom and position
  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);
  
  // Toggle animation playback
  const toggleAnimation = useCallback(() => {
    setIsPlaying((prev) => {
      const newState = !prev;
      return newState;
    });
  }, []);
  
  // Toggle background color
  const cycleBackground = useCallback(() => {
    setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
  }, [backgrounds.length]);
  
  // Handle variant selection
  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    if (onVariantSelect) {
      onVariantSelect(variantId);
    }
  }, [onVariantSelect]);
  
  // Handle customization request
  const handleCustomizeRequest = useCallback(() => {
    if (onCustomizeRequest && displaySvgContent && isSvgValid) {
      onCustomizeRequest(displaySvgContent);
    }
  }, [onCustomizeRequest, displaySvgContent, isSvgValid]);
  
  // Download SVG file
  const downloadSVG = useCallback(() => {
    if (!displaySvgContent || !isSvgValid) return;
    
    try {
      const blob = new Blob([displaySvgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || logo?.name || "logo"}.svg`;
      a.setAttribute('aria-label', `Download ${title || logo?.name || "logo"} as SVG`);
      
      // Use a more robust approach to download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.DOWNLOAD,
        context: {
          component: 'LogoDisplay',
          operation: 'downloadSVG'
        },
        logLevel: 'error'
      });
    }
  }, [displaySvgContent, isSvgValid, title, logo?.name]);
  
  // Download PNG file with enhanced error handling
  const downloadPNG = useCallback(() => {
    if (!displaySvgContent || !isSvgValid) return;
    
    try {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas 2D context not available");
      }
      
      // Create a new Image element
      const img = new Image();
      
      // Handle errors during image loading
      img.onerror = (error) => {
        handleError(error, {
          category: ErrorCategory.DOWNLOAD,
          context: {
            component: 'LogoDisplay',
            operation: 'downloadPNG_imgLoad'
          },
          logLevel: 'error'
        });
      };
      
      // Set up a callback for when the image loads
      img.onload = () => {
        try {
          // Set canvas dimensions to match the SVG with higher resolution for quality
          canvas.width = img.width * 2; // Higher resolution
          canvas.height = img.height * 2;
          
          // Draw the image onto the canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to PNG and download
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${title || logo?.name || "logo"}.png`;
          a.setAttribute('aria-label', `Download ${title || logo?.name || "logo"} as PNG`);
          
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(a);
          }, 100);
        } catch (error) {
          handleError(error, {
            category: ErrorCategory.DOWNLOAD,
            context: {
              component: 'LogoDisplay',
              operation: 'downloadPNG_canvas'
            },
            logLevel: 'error'
          });
        }
      };
      
      // Use a data URL for better cross-origin compatibility
      const svgBlob = new Blob([displaySvgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      
      // Apply additional CORS settings
      img.crossOrigin = "anonymous";
      img.src = url;
      
      // Clean up the object URL after the image loads or on error
      img.onload = () => {
        try {
          // Set canvas dimensions
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          
          // Draw image and generate PNG
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL("image/png");
          
          // Download the PNG
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${title || logo?.name || "logo"}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up
          URL.revokeObjectURL(url);
        } catch (error) {
          handleError(error, {
            category: ErrorCategory.DOWNLOAD,
            context: {
              component: 'LogoDisplay',
              operation: 'downloadPNG_onload'
            },
            logLevel: 'error'
          });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.DOWNLOAD,
        context: {
          component: 'LogoDisplay',
          operation: 'downloadPNG'
        },
        logLevel: 'error'
      });
    }
  }, [displaySvgContent, isSvgValid, title, logo?.name]);
  
  // Handle keyboard navigation for logo controls
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowUp':
        // Move logo up
        setPosition(prev => ({ ...prev, y: prev.y - 10 }));
        e.preventDefault();
        break;
      case 'ArrowDown':
        // Move logo down
        setPosition(prev => ({ ...prev, y: prev.y + 10 }));
        e.preventDefault();
        break;
      case 'ArrowLeft':
        // Move logo left
        setPosition(prev => ({ ...prev, x: prev.x - 10 }));
        e.preventDefault();
        break;
      case 'ArrowRight':
        // Move logo right
        setPosition(prev => ({ ...prev, x: prev.x + 10 }));
        e.preventDefault();
        break;
      case '+':
      case '=':
        // Zoom in
        handleZoom(0.1);
        e.preventDefault();
        break;
      case '-':
      case '_':
        // Zoom out
        handleZoom(-0.1);
        e.preventDefault();
        break;
      case 'r':
      case 'R':
        // Reset view
        handleReset();
        e.preventDefault();
        break;
      case ' ':
        // Toggle animation
        if (showAnimationControls) {
          toggleAnimation();
          e.preventDefault();
        }
        break;
      case 'b':
      case 'B':
        // Cycle background
        cycleBackground();
        e.preventDefault();
        break;
    }
  }, [handleZoom, handleReset, toggleAnimation, cycleBackground, showAnimationControls]);
  
  // Get the current background
  const currentBackground = backgrounds[backgroundIndex];
  
  // Get animation CSS from animatedLogo or provided CSS
  const effectiveAnimationCSS = animatedLogo?.cssCode || animationCSS;
  
  // Render skeleton loader for loading state
  if (isGenerating) {
    return (
      <Card className={cn("w-full max-w-md mx-auto overflow-hidden shadow-sm", className)} aria-busy="true" aria-live="polite">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
            {/* Improved skeleton loading state */}
            <div className="flex items-center justify-center w-full h-48 bg-muted rounded-md overflow-hidden relative">
              <div className="w-24 h-24 rounded-full bg-muted-foreground/20 absolute shimmer"></div>
              <div className="w-32 h-4 mt-32 bg-muted-foreground/20 rounded-md shimmer"></div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="animate-pulse">
                <div className="w-20 h-4 bg-muted-foreground/20 rounded-md shimmer"></div>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state with improved accessibility
  if (hasError) {
    return (
      <Card 
        className={cn("w-full max-w-md mx-auto overflow-hidden border-destructive", className)}
        role="alert"
        aria-live="assertive"
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center space-y-4 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive w-16 h-16"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <Paragraph className="text-destructive font-medium text-center">
              {errorMessage}
            </Paragraph>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render validation error state
  if (!isSvgValid && validationError) {
    return (
      <Card 
        className={cn("w-full max-w-md mx-auto overflow-hidden border-destructive", className)}
        role="alert"
        aria-live="assertive"
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center space-y-4 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500 w-16 h-16"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <Paragraph className="text-amber-600 dark:text-amber-400 font-medium text-center">
              {validationError}
            </Paragraph>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state with better UX
  if (!displaySvgContent) {
    return (
      <Card 
        className={cn("w-full max-w-md mx-auto overflow-hidden", className)}
        aria-label="No logo available"
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center space-y-4 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground w-16 h-16"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <Paragraph className="text-muted-foreground text-center">
              Ready to generate your logo
            </Paragraph>
            <Paragraph className="text-muted-foreground text-sm text-center max-w-xs">
              Describe your brand or upload an image to get started
            </Paragraph>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Main logo display component
  return (
    <Card 
      className={cn("w-full max-w-md mx-auto overflow-hidden shadow-sm", className)}
      id={id}
    >
      {/* Logo Title and Description with better semantics */}
      {(title || description) && (
        <div className="p-4 border-b">
          {title && (
            <h3 
              className="text-lg font-medium"
              id={`${id}-title`}
            >
              {title}
            </h3>
          )}
          {description && (
            <p 
              className="text-sm text-muted-foreground"
              id={`${id}-description`}
            >
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Logo Display Area - Enhanced with keyboard navigation */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="img"
        aria-label={`Logo ${title || logo?.name || ''}`}
        aria-describedby={description ? `${id}-description` : undefined}
      >
        {/* SVG Renderer with enhanced props */}
        <SVGRenderer
          svgContent={displaySvgContent}
          animationCSS={effectiveAnimationCSS}
          isPlaying={isPlaying}
          background={currentBackground?.value}
          zoom={zoom}
          position={position}
          showGrid={currentBackground?.value === "bg-transparent"}
          draggable={isDragging}
          className="w-full h-full"
          aspectRatio="1/1"
          aria-hidden="false"
        />
        
        {/* Animation Type Badge - Enhanced visibility */}
        {animationType && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm"
          >
            {animationType}
          </Badge>
        )}
        
        {/* Customize Button - Better positioning and contrast */}
        {onCustomizeRequest && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm shadow-sm hover:shadow transition-all"
            onClick={handleCustomizeRequest}
            aria-label="Customize logo"
          >
            <PencilIcon className="h-3 w-3 mr-1" aria-hidden="true" />
            <span>Customize</span>
          </Button>
        )}
        
        {/* Background indicator */}
        <div 
          className="absolute bottom-2 left-2 text-xs bg-background/70 text-foreground px-2 py-1 rounded-md backdrop-blur-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {currentBackground?.name}
        </div>
        
        {/* Keyboard controls helper - only shown when focused */}
        <div className="absolute bottom-2 right-2 opacity-0 focus-within:opacity-100 transition-opacity duration-200">
          <Badge variant="outline" className="bg-background/70 backdrop-blur-sm">
            Use arrow keys to move, +/- to zoom
          </Badge>
        </div>
      </div>
      
      {/* Control Bar - Enhanced accessibility */}
      <CardFooter className="p-3 border-t flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1" aria-label="Logo controls">
          {/* Animation Controls with proper labeling */}
          {showAnimationControls && (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleAnimation}
                aria-label={isPlaying ? "Pause Animation" : "Play Animation"}
                aria-pressed={!isPlaying}
              >
                {isPlaying ? (
                  <PauseIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PlayIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
              
              {/* Background Toggle with tooltip */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={cycleBackground}
                aria-label={`Change background (current: ${currentBackground?.description})`}
              >
                <PaletteIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          )}
          
          {/* Zoom Controls */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleZoom(-0.1)}
            aria-label="Zoom Out"
            disabled={zoom <= 0.5}
          >
            <MinusIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          
          <Badge 
            variant="outline" 
            className="text-xs px-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {Math.round(zoom * 100)}%
          </Badge>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleZoom(0.1)}
            aria-label="Zoom In"
            disabled={zoom >= 3}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            aria-label="Reset View"
          >
            <ResetIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        
        {/* Variant Selector with better scrolling */}
        {variants.length > 1 && (
          <div 
            className="flex items-center space-x-1 overflow-x-auto py-1 px-1 bg-muted/30 rounded-md w-full mt-2 no-scrollbar"
            role="radiogroup"
            aria-label="Logo variants"
          >
            {variants.map((variant) => (
              <Button
                key={variant.id}
                variant={selectedVariantId === variant.id ? "accent" : "ghost"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => handleVariantSelect(variant.id)}
                aria-checked={selectedVariantId === variant.id}
                role="radio"
              >
                {variant.name || variant.type}
              </Button>
            ))}
          </div>
        )}
        
        {/* Download Controls with more visual clarity */}
        {allowDownload && (
          <div className="flex items-center space-x-1 mt-2 w-full justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadSVG}
              aria-label={`Download ${title || logo?.name || "logo"} as SVG`}
              disabled={!isSvgValid}
              className="transition-all hover:shadow"
            >
              <DownloadIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              SVG
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadPNG}
              aria-label={`Download ${title || logo?.name || "logo"} as PNG`}
              disabled={!isSvgValid}
              className="transition-all hover:shadow"
            >
              <DownloadIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              PNG
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// Enhanced icon components with aria-hidden for better accessibility
function PauseIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function PlayIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PaletteIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="19" cy="12" r="2.5" />
      <circle cx="13.5" cy="17.5" r="2.5" />
      <circle cx="6" cy="14" r="2.5" />
      <circle cx="6" cy="8" r="2.5" />
      <path d="M12 2v20" strokeOpacity="0.5" />
      <path d="M2 12h20" strokeOpacity="0.5" />
    </svg>
  );
}

function MinusIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ResetIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M3 2v6h6" />
      <path d="M3 8a9 9 0 1 0 2.83-6.36L3 8" />
    </svg>
  );
}

function DownloadIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PencilIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export default LogoDisplay;