import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface AnimatedLogoDisplayProps {
  svgCode: string;
  cssCode?: string;
  jsCode?: string;
  className?: string;
  showControls?: boolean;
}

export const AnimatedLogoDisplay: React.FC<AnimatedLogoDisplayProps> = ({
  svgCode,
  cssCode,
  jsCode,
  className = '',
  showControls = false
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate a unique ID for this animation instance
  const animationId = React.useMemo(() => 
    `animated-logo-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );
  
  // Prepare the animated SVG with embedded CSS and JS
  const prepareAnimatedSvg = () => {
    // Add ID to the SVG element for targeting
    let modifiedSvg = svgCode.replace('<svg', `<svg id="${animationId}"`);
    
    // Create a document fragment to hold the full HTML content
    const fullContent = `
      <style>
        /* Container styles */
        .animated-logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        
        /* SVG styles */
        #${animationId} {
          max-width: 100%;
          max-height: 100%;
        }
        
        /* Custom animation CSS */
        ${cssCode || ''}
        
        /* Paused state */
        .animation-paused #${animationId} * {
          animation-play-state: paused !important;
          transition: none !important;
        }
      </style>
      
      <div class="animated-logo-container ${isPaused ? 'animation-paused' : ''}">
        ${modifiedSvg}
      </div>
      
      <script>
        // Execute when content is loaded
        (function() {
          // Custom animation JS
          ${jsCode || ''}
          
          // Animation control functions
          window.resetAnimation_${animationId} = function() {
            const svg = document.getElementById('${animationId}');
            if (svg) {
              // Clone and replace to restart animations
              const parent = svg.parentNode;
              const clone = svg.cloneNode(true);
              parent.replaceChild(clone, svg);
            }
          };
        })();
      </script>
    `;
    
    return fullContent;
  };
  
  // Toggle play/pause state
  const togglePlayPause = () => {
    setIsPaused(!isPaused);
    setIsPlaying(!isPaused);
  };
  
  // Reset animation
  const resetAnimation = () => {
    if (containerRef.current) {
      // Execute the reset function defined in the embedded script
      if (typeof window !== 'undefined' && window[`resetAnimation_${animationId}`]) {
        window[`resetAnimation_${animationId}`]();
      } else {
        // Fallback: Replace the entire content to reset
        const content = prepareAnimatedSvg();
        containerRef.current.innerHTML = content;
      }
      
      // Ensure playing state
      setIsPaused(false);
      setIsPlaying(true);
    }
  };
  
  // Set up animation on initial render
  useEffect(() => {
    if (containerRef.current) {
      const content = prepareAnimatedSvg();
      containerRef.current.innerHTML = content;
    }
    
    // Execute any JS code that needs to run after the DOM is updated
    if (jsCode && typeof window !== 'undefined') {
      try {
        // Use a safer approach than eval
        const executeScript = new Function(jsCode);
        executeScript();
      } catch (error) {
        console.error('Error executing animation JS:', error);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [svgCode, cssCode, jsCode, isPaused]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[200px]"
      />
      
      {showControls && (
        <div className="absolute bottom-2 right-2 flex space-x-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-8 h-8 p-0 rounded-full" 
            onClick={togglePlayPause}
            title={isPaused ? "Play animation" : "Pause animation"}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </Button>
          
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-8 h-8 p-0 rounded-full" 
            onClick={resetAnimation}
            title="Reset animation"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};