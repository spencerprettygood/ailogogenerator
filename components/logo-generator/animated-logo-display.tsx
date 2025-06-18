'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedLogoDisplayProps {
  svgCode?: string;
  cssCode?: string;
  jsCode?: string;
  className?: string;
  showControls?: boolean;
}

/**
 * Component to display an animated SVG logo with playback controls
 * 
 * This component renders an animated SVG logo using an inline approach
 * where the SVG, CSS, and JS are combined directly in the DOM.
 * It also provides optional play/pause/restart controls.
 */
export function AnimatedLogoDisplay({
  svgCode,
  cssCode,
  jsCode,
  className = '',
  showControls = true
}: AnimatedLogoDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Apply animation to the container when props change
  useEffect(() => {
    if (!containerRef.current || !svgCode) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    setHasLoaded(false);
    
    // Create the animated SVG container
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    
    // Add CSS if provided
    if (cssCode) {
      const styleElement = document.createElement('style');
      styleElement.textContent = cssCode;
      svgContainer.appendChild(styleElement);
    }
    
    // Add SVG content
    svgContainer.insertAdjacentHTML('beforeend', svgCode);
    
    // Add to DOM
    containerRef.current.appendChild(svgContainer);
    
    // Add JavaScript if provided
    if (jsCode) {
      try {
        // Use a safer approach than eval
        const executeJS = new Function('container', jsCode);
        executeJS(svgContainer);
      } catch (error) {
        console.error('Error executing animation JS:', error);
      }
    }
    
    setHasLoaded(true);
    setIsPlaying(true);
  }, [svgCode, cssCode, jsCode]);
  
  // Toggle play/pause state
  const togglePlayPause = () => {
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;
    
    if (isPlaying) {
      // Pause animations
      const animatedElements = containerRef.current.querySelectorAll('*');
      animatedElements.forEach((el: Element) => {
        if (el instanceof HTMLElement || el instanceof SVGElement) {
          (el as any).style.animationPlayState = 'paused';
        }
      });
    } else {
      // Resume animations
      const animatedElements = containerRef.current.querySelectorAll('*');
      animatedElements.forEach((el: Element) => {
        if (el instanceof HTMLElement || el instanceof SVGElement) {
          (el as any).style.animationPlayState = 'running';
        }
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Restart animation
  const restartAnimation = () => {
    if (!containerRef.current || !svgCode) return;
    
    // Easiest way to restart: remove and reapply the SVG content
    containerRef.current.innerHTML = '';
    
    // Recreate the animation
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    
    // Add CSS
    if (cssCode) {
      const styleElement = document.createElement('style');
      styleElement.textContent = cssCode;
      svgContainer.appendChild(styleElement);
    }
    
    // Add SVG
    svgContainer.insertAdjacentHTML('beforeend', svgCode);
    containerRef.current.appendChild(svgContainer);
    
    // Add JS
    if (jsCode) {
      try {
        const executeJS = new Function('container', jsCode);
        executeJS(svgContainer);
      } catch (error) {
        console.error('Error executing animation JS:', error);
      }
    }
    
    setIsPlaying(true);
  };
  
  return (
    <div className={`animated-logo-display ${className}`}>
      <div 
        ref={containerRef} 
        className="relative bg-white rounded-lg shadow-sm flex items-center justify-center"
        style={{ minHeight: '200px' }}
      >
        {!svgCode && (
          <div className="text-gray-400">No animated logo available</div>
        )}
      </div>
      
      {showControls && svgCode && hasLoaded && (
        <div className="flex justify-center mt-3 space-x-2">
          <button 
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
            onClick={togglePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button 
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
            onClick={restartAnimation}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}