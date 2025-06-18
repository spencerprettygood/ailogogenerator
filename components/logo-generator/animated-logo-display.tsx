import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface AnimatedLogoDisplayProps {
  svgCode: string;
  cssCode: string;
  jsCode?: string;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}

export function AnimatedLogoDisplay({
  svgCode,
  cssCode,
  jsCode,
  className = '',
  showControls = true,
  autoPlay = true,
  loop = true
}: AnimatedLogoDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentCss, setCurrentCss] = useState(cssCode);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Process SVG code to ensure it's a valid SVG
  const processedSvg = svgCode.trim().startsWith('<svg')
    ? svgCode
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgCode}</svg>`;

  // Generate the complete HTML for the iframe
  const generateIframeContent = useCallback(() => {
    const playingClass = isPlaying ? 'is-playing' : 'is-paused';
    const loopClass = loop ? 'is-looping' : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: transparent;
          }

          .animated-logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
          }

          .animated-logo-container svg {
            max-width: 100%;
            max-height: 100%;
          }

          .is-paused * {
            animation-play-state: paused !important;
          }

          ${currentCss}
        </style>
      </head>
      <body>
        <div class="animated-logo-container ${playingClass} ${loopClass}">
          ${processedSvg}
        </div>

        ${jsCode ? `<script>${jsCode}</script>` : ''}
      </body>
      </html>
    `;
  }, [isPlaying, loop, processedSvg, currentCss, jsCode]);

  // Update iframe content when props change
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateIframeContent());
        doc.close();
      }
    }
  }, [svgCode, currentCss, jsCode, isPlaying, loop, generateIframeContent]);

  // Toggle animation play state
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Restart animation
  const restartAnimation = () => {
    if (iframeRef.current) {
      const tempCss = currentCss;
      setCurrentCss('/* temp */');
      setTimeout(() => {
        setCurrentCss(tempCss);
        setIsPlaying(true);
      }, 10);
    }
  };

  // Toggle loop
  const toggleLoop = () => {
    // This would need custom handling in the CSS
    // For now, we'll just toggle the state
    // A proper implementation would modify animation-iteration-count in the CSS
    restartAnimation();
  };

  return (
    <div className={`animated-logo-display ${className}`}>
      <Card className="overflow-hidden">
        <div className="relative">
          <iframe
            ref={iframeRef}
            srcDoc={generateIframeContent()}
            className="w-full aspect-square border-0"
            title="Animated Logo"
            sandbox="allow-scripts"
          />
          
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/20 backdrop-blur-sm">
              <div className="flex justify-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={togglePlay}
                  className="text-xs"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={restartAnimation}
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
                  {loop ? 'Loop: On' : 'Loop: Off'}
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
          SVG + CSS Animation
        </div>
      </div>
    </div>
  );
}

// Export a preview component for showing small animated logo previews
export function AnimatedLogoPreview({
  svgCode,
  cssCode,
  jsCode,
  className = ''
}: Omit<AnimatedLogoDisplayProps, 'showControls' | 'autoPlay' | 'loop'>) {
  return (
    <AnimatedLogoDisplay
      svgCode={svgCode}
      cssCode={cssCode}
      jsCode={jsCode}
      className={`${className} w-24 h-24`}
      showControls={false}
      autoPlay={true}
      loop={true}
    />
  );
}