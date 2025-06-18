"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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
}

/**
 * SVG Renderer Component
 * 
 * A component for rendering SVG content with support for animations,
 * zoom, pan, and different backgrounds.
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
  aspectRatio = "1/1",
  showGrid = false,
}: SVGRendererProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [containerId] = useState(`svg-container-${Math.random().toString(36).slice(2, 11)}`);
  
  // Extract SVG dimensions from the SVG content
  useEffect(() => {
    if (svgContent && svgRef.current) {
      try {
        // Create a temporary div to parse the SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgContent;
        const svgElement = tempDiv.querySelector('svg');
        
        if (svgElement) {
          // Get the viewBox
          const viewBox = svgElement.getAttribute('viewBox');
          if (viewBox) {
            const [,, width, height] = viewBox.split(' ').map(Number);
            setSvgDimensions({ width, height });
          } else if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
            // Get width and height attributes
            const width = parseFloat(svgElement.getAttribute('width') || '0');
            const height = parseFloat(svgElement.getAttribute('height') || '0');
            if (width && height) {
              setSvgDimensions({ width, height });
            }
          }
        }
      } catch (error) {
        console.error("Error parsing SVG dimensions:", error);
      }
    }
  }, [svgContent]);
  
  // Create animation class based on playback state
  const animationClass = isPlaying ? "animate-running" : "animate-paused";
  
  // Determine if background is a CSS class or a color value
  const isBackgroundClass = background?.startsWith('bg-');
  const backgroundClass = isBackgroundClass ? background : '';
  const backgroundStyle = isBackgroundClass ? {} : { backgroundColor: background };
  
  // Handle background and grid
  const gridClass = showGrid ? 'bg-grid' : '';
  
  return (
    <>
      {/* Animation style */}
      {animationCSS && (
        <style dangerouslySetInnerHTML={{ __html: animationCSS }} />
      )}
      
      {/* SVG container */}
      <div
        id={containerId}
        className={cn(
          "relative overflow-hidden",
          backgroundClass,
          gridClass,
          draggable ? "cursor-grab active:cursor-grabbing" : "",
          className
        )}
        style={{
          ...backgroundStyle,
          aspectRatio: aspectRatio
        }}
        onClick={onClick}
      >
        {/* SVG content with zoom and position */}
        <div
          ref={svgRef}
          className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            animationClass
          )}
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </>
  );
}

export default SVGRenderer;