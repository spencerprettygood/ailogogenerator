'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Copy,
  Maximize,
  Minimize,
  Palette,
  Code,
  Check,
  Eye,
  EyeOff,
  Share2,
  Sparkles,
} from 'lucide-react';
import { SVGLogo } from '@/lib/types';
import LogoDisplay from './logo-display';
import { AnimatedLogoDisplay } from './animated-logo-display';
import { toast } from '@/lib/hooks/use-toast';

interface EnhancedLogoCardProps {
  logo: SVGLogo | { svgCode: string };
  brandName?: string;
  animatedSvg?: string;
  animationCss?: string;
  animationJs?: string;
  colorPalette?: string[];
  className?: string;
  onDownload?: () => void;
  onShare?: () => void;
  showControls?: boolean;
}

export function EnhancedLogoCard({
  logo,
  brandName = 'Your Logo',
  animatedSvg,
  animationCss,
  animationJs,
  colorPalette = ['#4A90E2', '#50E3C2', '#F39C12', '#E74C3C'],
  className = '',
  onDownload,
  onShare,
  showControls = true,
}: EnhancedLogoCardProps) {
  // State for interactions
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimated, setIsAnimated] = useState(!!animatedSvg);
  const [showCode, setShowCode] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  // Handle copy SVG to clipboard
  const handleCopy = () => {
    const svgCode = 'elements' in logo ? logo.svg || logo.svgCode : logo.svgCode;
    if (svgCode) {
      navigator.clipboard
        .writeText(svgCode)
        .then(() => {
          setCopied(true);
          toast({
            title: 'SVG Copied',
            description: 'SVG code copied to clipboard',
          });
        })
        .catch(err => {
          console.error('Failed to copy SVG:', err);
          toast({
            title: 'Copy Failed',
            description: 'Failed to copy SVG code',
            variant: 'destructive',
          });
        });
    }
  };

  // Handle code view toggle
  const toggleCodeView = () => {
    setShowCode(!showCode);
    // Close other panels when opening code
    if (!showCode) {
      setShowColors(false);
    }
  };

  // Handle color palette toggle
  const toggleColorPalette = () => {
    setShowColors(!showColors);
    // Close other panels when opening colors
    if (!showColors) {
      setShowCode(false);
    }
  };

  // Handle animation toggle
  const toggleAnimation = () => {
    if (animatedSvg) {
      setIsAnimated(!isAnimated);
    } else {
      toast({
        title: 'Animation Not Available',
        description: "This logo doesn't have an animated version",
        variant: 'destructive',
      });
    }
  };

  // Format SVG code for display
  const formatSvgForDisplay = (svg: string) => {
    return svg
      .replace(/></g, '>\n<')
      .replace(/<svg/g, '\n<svg')
      .replace(/<\/svg>/g, '\n</svg>');
  };

  // Get SVG code with type safety
  const svgCode = 'elements' in logo ? logo.svg || logo.svgCode : logo.svgCode;

  // Framer Motion variants
  const cardVariants: import('framer-motion').Variants = {
    normal: {
      maxWidth: '100%',
      maxHeight: '400px',
      scale: 1,
      zIndex: 1,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    expanded: {
      maxWidth: '90vw',
      maxHeight: '80vh',
      scale: 1,
      zIndex: 50,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    hover: {
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      y: -4,
      transition: { duration: 0.2 },
    },
  };

  // Color palette item animation
  const colorItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial="normal"
      animate={isExpanded ? 'expanded' : isHovering ? 'hover' : 'normal'}
      variants={cardVariants}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      ref={cardRef}
      style={{
        borderRadius: '0.75rem',
        transformOrigin: 'center',
        overflow: 'hidden',
      }}
    >
      <Card
        className={`relative overflow-hidden transition-shadow duration-300 h-full ${isExpanded ? 'fixed inset-4 z-50 m-auto' : ''}`}
      >
        {/* Logo display */}
        <div
          className={`p-6 flex items-center justify-center ${isExpanded ? 'h-5/6 overflow-auto' : 'h-[280px]'}`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isAnimated && animatedSvg ? (
                <motion.div
                  key="animated"
                  className="w-full h-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatedLogoDisplay
                    svgCode={animatedSvg}
                    cssCode={animationCss}
                    jsCode={animationJs}
                    className="max-w-full max-h-full"
                    showControls={isExpanded}
                    lazyLoad={false}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="static"
                  className="w-full h-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LogoDisplay svgCode={svgCode} variants={[]} className="max-w-full max-h-full" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sparkle effect on hover */}
            <AnimatePresence>
              {isHovering && !isExpanded && (
                <motion.div
                  className="absolute top-0 right-0 m-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls and info */}
        {showControls && (
          <div className="border-t bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm truncate max-w-[150px]" title={brandName}>
                  {brandName}
                </h3>
                <div className="flex mt-1">
                  {animatedSvg && (
                    <Badge
                      variant={isAnimated ? 'default' : 'outline'}
                      className="mr-2 cursor-pointer transition-colors"
                      onClick={toggleAnimation}
                    >
                      {isAnimated ? 'Animated' : 'Static'}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    SVG
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-1">
                {animatedSvg && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleAnimation}
                    title={isAnimated ? 'Show static version' : 'Show animated version'}
                  >
                    {isAnimated ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleColorPalette}
                  title="Show color palette"
                >
                  <Palette className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleCodeView}
                  title="View SVG code"
                >
                  <Code className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopy}
                  title="Copy SVG code"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                {onDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onDownload}
                    title="Download logo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {onShare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onShare}
                    title="Share logo"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Color palette panel */}
            <AnimatePresence>
              {showColors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="p-2 bg-card rounded-md border">
                    <h4 className="text-xs font-medium mb-2">Color Palette</h4>
                    <div className="flex flex-wrap gap-2">
                      {colorPalette.map((color, index) => (
                        <motion.div
                          key={`${color}-${index}`}
                          className="flex flex-col items-center"
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={colorItemVariants}
                        >
                          <div
                            className="h-8 w-8 rounded-full cursor-pointer hover:scale-110 transition-transform border"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              navigator.clipboard.writeText(color);
                              toast({
                                title: 'Color Copied',
                                description: `${color} copied to clipboard`,
                              });
                            }}
                            title={`Copy ${color}`}
                          />
                          <span className="text-[10px] mt-1">{color}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code view panel */}
            <AnimatePresence>
              {showCode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="p-2 bg-card rounded-md border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium">SVG Code</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 py-1 px-2 text-xs"
                        onClick={handleCopy}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <pre
                      ref={codeRef}
                      className="text-xs bg-muted p-2 rounded max-h-[150px] overflow-auto"
                    >
                      {formatSvgForDisplay(svgCode || '')}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Card>

      {/* Background overlay when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
