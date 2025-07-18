'use client';

import React from 'react';
import { VariantSwitcherProps } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VariantSwitcher: React.FC<VariantSwitcherProps> = ({
  variants,
  selectedVariantId,
  onVariantChange,
}) => {
  if (!variants || variants.length <= 1) {
    return null; // Don't show switcher if no variants or only one
  }

  return (
    <div className="flex items-center flex-wrap justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mr-2 whitespace-nowrap">
        Variants:
      </p>
      {variants.map(variant => (
        <Button
          key={variant.id}
          variant={selectedVariantId === variant.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVariantChange?.(variant.id)}
          className={cn(
            'transition-all duration-150 ease-in-out text-xs px-3 py-1 h-auto',
            selectedVariantId === variant.id
              ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
              : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {variant.name}
        </Button>
      ))}
    </div>
  );
};

export default VariantSwitcher;
