'use client';

import React from 'react';
import { BackgroundSelectorProps } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  backgrounds,
  selectedBackground,
  onSelectBackgroundAction,
}) => {
  if (!backgrounds || backgrounds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center flex-wrap justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mr-2 whitespace-nowrap">Background:</p>
      {backgrounds.map((bgColor) => {
        const isColorClass = bgColor.startsWith('bg-');
        const displayStyle = isColorClass ? {} : { backgroundColor: bgColor };
        // Ensure border is visible on light backgrounds too
        const displayClass = isColorClass ? bgColor : 'w-6 h-6 rounded border border-gray-300 dark:border-gray-500'; 

        return (
          <Button
            key={bgColor}
            variant="outline"
            size="icon"
            onClick={() => onSelectBackgroundAction(bgColor)}
            className={cn(
              'w-7 h-7 rounded-md transition-all duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800',
              selectedBackground === bgColor && 'ring-2 ring-offset-1 ring-blue-600 dark:ring-blue-400 dark:ring-offset-gray-800',
              !isColorClass && 'p-0' // Remove padding for custom color swatches
            )}
            aria-label={`Select background ${bgColor}`}
          >
            <div
              className={cn(
                'w-full h-full rounded flex items-center justify-center',
                displayClass
              )}
              style={displayStyle}
            >
              {selectedBackground === bgColor && (
                <Check className={cn(
                  'h-3.5 w-3.5',
                  (isColorClass && (bgColor.includes('dark') || bgColor.includes('black') || bgColor.includes('slate') || bgColor.includes('zinc'))) || 
                  (!isColorClass && isDarkColor(bgColor)) 
                  ? 'text-white' 
                  : 'text-black'
                )} />
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
};

// Helper to determine if a hex color is dark
function isDarkColor(hexColor: string): boolean {
  if (!hexColor || typeof hexColor !== 'string' || hexColor.length < 4) return false; // Basic check
  const hex = hexColor.replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return false; // Check for valid hex length
  
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false; // Check for valid numbers

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export default BackgroundSelector;
