'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Palette, Wand2 } from 'lucide-react';

interface TypingIndicatorProps {
  stage?: string;
  message?: string;
  className?: string;
}

export function TypingIndicator({
  stage,
  message,
  className = '',
}: TypingIndicatorProps) {
  const [currentThought, setCurrentThought] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const designThoughts = [
    'Analyzing color harmony principles...',
    'Balancing negative space for visual impact...',
    'Refining typography for brand voice...',
    'Optimizing for scalability across platforms...',
    'Ensuring clear visual hierarchy...',
    'Exploring geometric proportions...',
    'Considering cultural symbolism...',
    'Applying golden ratio principles...',
    'Testing against competitive landscape...',
    'Refining stroke weights for consistency...',
    'Balancing symmetry and dynamism...',
    'Optimizing for single-color applications...',
  ];

  useEffect(() => {
    // Rotate through design thoughts every 3 seconds
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentThought(prev => (prev + 1) % designThoughts.length);
        // Occasionally pause for a more natural rhythm
        if (Math.random() > 0.7) {
          setIsPaused(true);
          setTimeout(() => setIsPaused(false), 2000);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, designThoughts.length]);

  const getIcon = () => {
    // Default icon if no stage is provided
    if (!stage) return <Sparkles className="h-4 w-4 text-primary" />;

    // Ensure stage is a string
    const stageStr = String(stage);

    switch (stageStr) {
      case 'A':
      case 'B':
      case 'C':
        return <Palette className="h-4 w-4 text-primary" />;
      case 'D':
      case 'E':
      case 'F':
        return <Wand2 className="h-4 w-4 text-primary" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  // Ensure message is a string
  const displayMessage = typeof message === 'string' ? message : 'Generating your logo...';

  return (
    <div className={`flex justify-start ${className}`}>
      <Card className="bg-card p-4 max-w-[60%] shadow-sm">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="font-medium text-sm">{displayMessage}</span>
            <div className="flex space-x-1 ml-1">
              <div
                className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>

          {/* Design thought process */}
          <div className="text-sm text-muted-foreground pl-6 border-l-2 border-muted">
            <div className="opacity-80 transition-opacity duration-500">
              {designThoughts[currentThought]}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Backward compatibility export
export const EnhancedTypingIndicator = TypingIndicator;

// Export interface for TypeScript users
export type { TypingIndicatorProps as EnhancedTypingIndicatorProps };
