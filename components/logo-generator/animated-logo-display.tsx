'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface AnimatedLogoDisplayProps {
  svgCode?: string;
  cssCode?: string;
  jsCode?: string;
  className?: string;
  showControls?: boolean;
  lazyLoad?: boolean;
}

/**
 * Component to display an animated SVG logo with playback controls
 * 
 * This component renders an animated SVG logo using an inline approach
 * where the SVG, CSS, and JS are combined directly in the DOM.
 * It also provides optional play/pause/restart controls.
 * 
 * Performance optimizations:
 * - Uses IntersectionObserver for lazy loading
 * - Memoizes SVG content to prevent unnecessary DOM manipulations
 * - Uses requestAnimationFrame for smooth animation control
 * - Properly cleans up resources on unmount
 * - Uses DOM manipulation directly instead of innerHTML for better performance
 */
export function AnimatedLogoDisplay({
  svgCode,
  cssCode,
  jsCode,
  className = '',
  showControls = true,
  lazyLoad = true
}: AnimatedLogoDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const jsExecRef = useRef<Function | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazyLoad);

  // Create SVG parser once
  const parser = useMemo(() => {
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      return new DOMParser();
    }
    return null;
  }, []);
  
  // Cleanup function to properly remove resources
  const cleanupResources = useCallback(() => {
    if (svgContainerRef.current) {
      if (containerRef.current?.contains(svgContainerRef.current)) {
        containerRef.current.removeChild(svgContainerRef.current);
      }
      svgContainerRef.current = null;
    }
    
    if (jsExecRef.current) {
      jsExecRef.current = null;
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);
  
  // Create a function to set up the animation
  const setupAnimation = useCallback(() => {
    if (!containerRef.current || !svgCode || !isVisible) return;
    
    // Clean up previous resources
    cleanupResources();
    setHasLoaded(false);
    
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      // Create the animated SVG container
      const svgContainer = document.createElement('div');
      svgContainer.className = 'svg-container';
      svgContainerRef.current = svgContainer;
      
      // Add CSS if provided
      if (cssCode) {
        const styleElement = document.createElement('style');
        styleElement.textContent = cssCode;
        styleRef.current = styleElement;
        svgContainer.appendChild(styleElement);
      }
      
      // Parse and add SVG content - safer than innerHTML
      if (parser) {
        try {
          const doc = parser.parseFromString(svgCode, 'image/svg+xml');
          const svgElement = doc.documentElement;
          
          // Clone the SVG to avoid issues with the parser's document
          const importedSvg = document.importNode(svgElement, true);
          svgContainer.appendChild(importedSvg);
        } catch (error) {
          // Fallback to innerHTML if parsing fails
          console.warn('SVG parsing failed, using innerHTML as fallback:', error);
          svgContainer.insertAdjacentHTML('beforeend', svgCode);
        }
      } else {
        // Fallback for environments without DOMParser
        svgContainer.insertAdjacentHTML('beforeend', svgCode);
      }
      
      // Add to DOM
      containerRef.current?.appendChild(svgContainer);
      
      // Add JavaScript if provided - only create the function once
      if (jsCode && !jsExecRef.current) {
        try {
          jsExecRef.current = new Function('container', jsCode);
        } catch (error) {
          console.error('Error creating animation JS function:', error);
        }
      }
      
      // Execute JS if function exists
      if (jsExecRef.current) {
        try {
          jsExecRef.current(svgContainer);
        } catch (error) {
          console.error('Error executing animation JS:', error);
        }
      }
      
      setHasLoaded(true);
      setIsPlaying(true);
    });
  }, [svgCode, cssCode, jsCode, isVisible, parser, cleanupResources]);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) {
      setIsVisible(true);
      return;
    }
    
    if (!containerRef.current) return;
    
    const options = {
      root: null,
      rootMargin: '100px', // Load when within 100px of viewport
      threshold: 0.1
    };
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Disconnect after becoming visible
          if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      });
    };
    
    observerRef.current = new IntersectionObserver(handleIntersection, options);
    observerRef.current.observe(containerRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [lazyLoad]);
  
  // Apply animation when visibility or content changes
  useEffect(() => {
    if (isVisible) {
      setupAnimation();
    }
    
    return () => {
      cleanupResources();
    };
  }, [isVisible, setupAnimation, cleanupResources]);
  
  // Toggle play/pause state using requestAnimationFrame for smoother UI
  const togglePlayPause = useCallback(() => {
    if (!containerRef.current) return;
    
    requestAnimationFrame(() => {
      const animationState = !isPlaying ? 'running' : 'paused';
      
      // Get animated elements
      const animatedElements = containerRef.current.querySelectorAll('*');
      
      // Apply animation state to all elements
      animatedElements.forEach((el: Element) => {
        if (el instanceof HTMLElement || el instanceof SVGElement) {
          (el as HTMLElement | SVGElement).style.animationPlayState = animationState;
        }
      });
      
      setIsPlaying(!isPlaying);
    });
  }, [isPlaying]);
  
  // Restart animation with optimized implementation
  const restartAnimation = useCallback(() => {
    if (!containerRef.current || !svgCode) return;
    
    // Use setupAnimation to recreate the animation with all optimizations
    cleanupResources();
    setupAnimation();
  }, [svgCode, cleanupResources, setupAnimation]);
  
  // Memoize buttons to avoid unnecessary re-renders
  const controlButtons = useMemo(() => {
    if (!showControls || !svgCode || !hasLoaded) return null;
    
    return (
      <div className="flex justify-center mt-3 space-x-2">
        <button 
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
          onClick={restartAnimation}
          aria-label="Restart animation"
        >
          Restart
        </button>
      </div>
    );
  }, [showControls, svgCode, hasLoaded, isPlaying, togglePlayPause, restartAnimation]);
  
  return (
    <div className={`animated-logo-display ${className}`}>
      <div 
        ref={containerRef} 
        className="relative bg-white rounded-lg shadow-sm flex items-center justify-center"
        style={{ 
          minHeight: '200px',
          contain: 'content', // CSS containment for performance
        }}
        data-testid="animated-logo-container"
      >
        {!svgCode && !isVisible && (
          <div className="text-gray-400">Loading animation...</div>
        )}
        {!svgCode && isVisible && (
          <div className="text-gray-400">No animated logo available</div>
        )}
      </div>
      
      {controlButtons}
    </div>
  );
}