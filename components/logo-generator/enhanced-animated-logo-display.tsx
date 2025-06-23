'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatedSVGLogo, AnimationOptions } from '../../lib/animation/types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface EnhancedAnimatedLogoDisplayProps {
  animatedLogo: AnimatedSVGLogo;
  width?: number | string;
  height?: number | string;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  onAnimationEnd?: () => void;
}

/**
 * Enhanced component for displaying animated SVG logos
 * Uses an iframe to safely render the SVG with animations
 * Provides controls for play/pause/restart
 */
const EnhancedAnimatedLogoDisplay: React.FC<EnhancedAnimatedLogoDisplayProps> = ({
  animatedLogo,
  width = '100%',
  height = 'auto',
  className = '',
  showControls = true,
  autoPlay = true,
  loop = false,
  onAnimationEnd,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isReady, setIsReady] = useState(false);
  const [isLooping, setIsLooping] = useState(loop);

  // Create HTML content for the iframe
  const generateIframeContent = () => {
    const { animatedSvg, cssCode, jsCode } = animatedLogo;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Animated Logo</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent;
          }
          
          svg {
            max-width: 100%;
            max-height: 100%;
          }
          
          .paused * {
            animation-play-state: paused !important;
          }
          
          ${cssCode || ''}
        </style>
      </head>
      <body class="${!autoPlay ? 'paused' : ''}">
        ${animatedSvg}
        
        <script>
          // Make logo animation controllable from the parent
          window.addEventListener('message', function(event) {
            if (event.data === 'play') {
              document.body.classList.remove('paused');
            } else if (event.data === 'pause') {
              document.body.classList.add('paused');
            } else if (event.data === 'restart') {
              // Restart by briefly detaching and reattaching the SVG
              const svg = document.querySelector('svg');
              const parent = svg.parentNode;
              const clone = svg.cloneNode(true);
              parent.removeChild(svg);
              
              // Force a reflow
              void parent.offsetWidth;
              
              // Add the clone
              parent.appendChild(clone);
              document.body.classList.remove('paused');
            } else if (event.data === 'setLoop') {
              // Loop handling is primarily managed by the parent
              // but we could modify animations here if needed
            }
          });
          
          // Handle animation end event
          document.addEventListener('animationend', function(event) {
            // Only send the message if the animation is on the SVG or a direct child
            if (event.target.matches('svg') || event.target.closest('svg')) {
              window.parent.postMessage('animationEnd', '*');
            }
          });
          
          // Notify parent when ready
          window.addEventListener('load', function() {
            window.parent.postMessage('ready', '*');
          });
          
          ${jsCode || ''}
        </script>
      </body>
      </html>
    `;
  };

  // Set up the iframe content and message handlers
  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Write content to iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(generateIframeContent());
      iframeDoc.close();
    }
    
    // Set up message listener for animation events
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'animationEnd' && onAnimationEnd) {
        onAnimationEnd();
        if (!isLooping) {
          setIsPlaying(false);
        }
      } else if (event.data === 'ready') {
        setIsReady(true);
        if (!autoPlay) {
          iframe.contentWindow?.postMessage('pause', '*');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [animatedLogo, onAnimationEnd, isLooping, autoPlay]);

  // Control functions
  const play = () => {
    if (!iframeRef.current || !isReady) return;
    
    iframeRef.current.contentWindow?.postMessage('play', '*');
    setIsPlaying(true);
  };
  
  const pause = () => {
    if (!iframeRef.current || !isReady) return;
    
    iframeRef.current.contentWindow?.postMessage('pause', '*');
    setIsPlaying(false);
  };
  
  const restart = () => {
    if (!iframeRef.current || !isReady) return;
    
    iframeRef.current.contentWindow?.postMessage('restart', '*');
    setIsPlaying(true);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    iframeRef.current?.contentWindow?.postMessage('setLoop', '*');
  };

  return (
    <div className={`enhanced-animated-logo-display ${className}`}>
      <Card className="overflow-hidden">
        <div className="relative">
          <iframe
            ref={iframeRef}
            title="Animated Logo"
            style={{
              width: width,
              height: height === 'auto' ? 'auto' : height,
              aspectRatio: height === 'auto' ? '1 / 1' : undefined,
              border: 'none',
              backgroundColor: 'transparent',
            }}
            sandbox="allow-scripts"
          />
          
          {showControls && isReady && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/20 backdrop-blur-sm">
              <div className="flex justify-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={isPlaying ? pause : play}
                  className="text-xs"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={restart}
                  className="text-xs"
                >
                  Restart
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleLoop}
                  className="text-xs"
                >
                  {isLooping ? 'Loop: On' : 'Loop: Off'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <div className="mt-2 flex justify-between items-center">
        <Badge variant="outline" className="text-xs">
          Animated SVG
        </Badge>
        
        <div className="text-xs text-gray-500">
          {animatedLogo.animationOptions.type.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
};

// Preview component for small animated logo displays
export const AnimatedLogoPreview: React.FC<Omit<EnhancedAnimatedLogoDisplayProps, 'showControls' | 'autoPlay' | 'loop' | 'onAnimationEnd'>> = (props) => {
  return (
    <EnhancedAnimatedLogoDisplay
      {...props}
      showControls={false}
      autoPlay={true}
      loop={true}
      className={`${props.className} w-24 h-24`}
    />
  );
};

export default EnhancedAnimatedLogoDisplay;