"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AnimationType } from "@/lib/animation/types";
import { useTheme } from "@/components/providers/theme-provider";
import { LogoVariant, SVGLogo, AnimatedLogo } from "@/lib/types";
import { SVGRenderer } from "./svg-renderer";
import { cn } from "@/lib/utils";

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
}

/** 
 * Logo Display Component
 * 
 * Displays the generated SVG logo with controls for preview, animation, and customization.
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
}: LogoDisplayProps) {
  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 && variants[0].id ? variants[0].id : null
  );
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Theme
  const { isDark } = useTheme();
  
  // Background options with CSS classes
  const backgrounds = [
    { name: "Light", value: "bg-white" },
    { name: "Dark", value: "bg-gray-900" },
    { name: "Transparent", value: "bg-transparent" },
    { name: "Accent", value: "bg-accent/10" },
    { name: "Blue", value: "bg-blue-100 dark:bg-blue-900" },
    { name: "Green", value: "bg-green-100 dark:bg-green-900" },
  ];
  
  // Determine the SVG content to display
  const displaySvgContent = React.useMemo(() => {
    // If a specific variant is selected, use its SVG
    if (selectedVariantId && variants.length > 0) {
      const selectedVariant = variants.find(v => v.id === selectedVariantId);
      if (selectedVariant) {
        return selectedVariant.svgCode;
      }
    }
    
    // Otherwise use the logo SVG or provided SVG content
    if (logo?.svgCode) {
      return logo.svgCode;
    }
    
    // Handle both svgContent and svgCode for compatibility
    if (svgContent) {
      // Check if the content might be from AI SDK v5 format (contains an SVG tag)
      if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
        // Extract SVG content using regex for safety
        const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch) {
          return svgMatch[0];
        }
      }
      
      return svgContent;
    }

    // Fall back to svgCode
    return svgCode || "";
  }, [logo, svgContent, svgCode, selectedVariantId, variants]);
  
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
    
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
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
    
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
    
    // Prevent page scrolling while dragging
    e.preventDefault();
  };
  
  // Handle mouseup/touchend to end drag operations
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Handle zoom in/out
  const handleZoom = (delta: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.max(0.5, Math.min(3, prevZoom + delta));
      return newZoom;
    });
  };
  
  // Reset zoom and position
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Toggle animation playback
  const toggleAnimation = () => {
    setIsPlaying((prev) => !prev);
  };
  
  // Toggle background color
  const cycleBackground = () => {
    setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
  };
  
  // Handle variant selection
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    if (onVariantSelect) {
      onVariantSelect(variantId);
    }
  };
  
  // Handle customization request
  const handleCustomizeRequest = () => {
    if (onCustomizeRequest && displaySvgContent) {
      onCustomizeRequest(displaySvgContent);
    }
  };
  
  // Download SVG file
  const downloadSVG = () => {
    if (!displaySvgContent) return;
    
    const blob = new Blob([displaySvgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || logo?.name || "logo"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Download PNG file (requires a server-side conversion for production)
  const downloadPNG = () => {
    if (!displaySvgContent) return;
    
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Create a new Image element
    const img = new Image();
    
    // Set up a callback for when the image loads
    img.onload = () => {
      // Set canvas dimensions to match the SVG
      canvas.width = img.width * 2; // Higher resolution
      canvas.height = img.height * 2;
      
      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to PNG and download
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${title || logo?.name || "logo"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    
    // Convert SVG to data URL and set as image source
    const svgBlob = new Blob([displaySvgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };
  
  // Render loading state
  if (isGenerating) {
    return (
      <Card className={cn("w-full max-w-md mx-auto overflow-hidden", className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
            <div className="rounded-md bg-muted w-full h-40"></div>
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary">Generating...</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (hasError) {
    return (
      <Card className={cn("w-full max-w-md mx-auto overflow-hidden border-destructive", className)}>
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
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-destructive font-medium">{errorMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (!displaySvgContent) {
    return (
      <Card className={cn("w-full max-w-md mx-auto overflow-hidden", className)}>
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
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p className="text-muted-foreground">No logo generated yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get the current background
  const currentBackground = backgrounds[backgroundIndex];
  
  // Get animation CSS from animatedLogo or provided CSS
  const effectiveAnimationCSS = animatedLogo?.cssCode || animationCSS;
  
  return (
    <Card className={cn("w-full max-w-md mx-auto overflow-hidden", className)}>
      {/* Logo Title and Description */}
      {(title || description) && (
        <div className="p-4 border-b">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      {/* Logo Display Area */}
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
      >
        {/* SVG Renderer */}
        <SVGRenderer
          svgContent={displaySvgContent}
          animationCSS={effectiveAnimationCSS}
          isPlaying={isPlaying}
          background={currentBackground.value}
          zoom={zoom}
          position={position}
          showGrid={currentBackground.value === "bg-transparent"}
          draggable={isDragging}
          className="w-full h-full"
        />
        
        {/* Animation Type Badge */}
        {animationType && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
          >
            {animationType}
          </Badge>
        )}
        
        {/* Customize Button */}
        {onCustomizeRequest && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            onClick={handleCustomizeRequest}
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Customize
          </Button>
        )}
      </div>
      
      {/* Control Bar */}
      <CardFooter className="p-3 border-t flex flex-wrap items-center justify-between gap-2">
        {showAnimationControls && (
          <div className="flex items-center space-x-1">
            {/* Animation Controls */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleAnimation}
              title={isPlaying ? "Pause Animation" : "Play Animation"}
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            
            {/* Background Toggle */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={cycleBackground}
              title="Change Background"
            >
              <PaletteIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          {/* Zoom Controls */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleZoom(-0.1)}
            title="Zoom Out"
            disabled={zoom <= 0.5}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          
          <Badge variant="outline" className="text-xs px-2">
            {Math.round(zoom * 100)}%
          </Badge>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleZoom(0.1)}
            title="Zoom In"
            disabled={zoom >= 3}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            title="Reset View"
          >
            <ResetIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Variant Selector */}
        {variants.length > 1 && (
          <div className="flex items-center space-x-1 overflow-x-auto py-1 px-1 bg-muted/30 rounded-md w-full mt-2">
            {variants.map((variant) => (
              <Button
                key={variant.id}
                variant={selectedVariantId === variant.id ? "accent" : "ghost"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => handleVariantSelect(variant.id)}
              >
                {variant.name || variant.type}
              </Button>
            ))}
          </div>
        )}
        
        {/* Download Controls */}
        {allowDownload && (
          <div className="flex items-center space-x-1 mt-2 w-full justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={downloadSVG}
              title="Download SVG"
            >
              <DownloadIcon className="h-4 w-4 mr-1" />
              SVG
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={downloadPNG}
              title="Download PNG"
            >
              <DownloadIcon className="h-4 w-4 mr-1" />
              PNG
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// Icon components
function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PaletteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
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

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ResetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 2v6h6" />
      <path d="M3 8a9 9 0 1 0 2.83-6.36L3 8" />
    </svg>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export default LogoDisplay;