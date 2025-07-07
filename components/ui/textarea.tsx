'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Textarea variants following asymmetric design principles
const textareaVariants = cva(
  // Base textarea styles
  [
    'flex w-full min-h-[80px] bg-background text-foreground text-sm transition-all',
    'placeholder:text-muted-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'ring-offset-background focus-visible:outline-none',
  ],
  {
    variants: {
      variant: {
        // Default with border
        default: [
          'border border-input',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        ],

        // Accent border
        accent: [
          'border border-accent/50',
          'focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent',
        ],

        // Asymmetric with offset shadow
        asymmetric: [
          'border border-input shadow-[3px_3px_0_0_hsl(var(--accent))]',
          'transform -translate-x-[1px] -translate-y-[1px]',
          'focus-visible:translate-x-0 focus-visible:translate-y-0',
          'focus-visible:shadow-[1px_1px_0_0_hsl(var(--accent))]',
        ],

        // Minimal with underline only
        minimal: [
          'border-b-2 border-input rounded-none px-1 py-2',
          'focus-visible:border-b-accent',
        ],

        // Filled background
        filled: [
          'border-0 bg-input',
          'focus-visible:bg-input/80 focus-visible:ring-1 focus-visible:ring-accent',
        ],
      },
      size: {
        default: 'p-3',
        sm: 'p-2 text-xs',
        lg: 'p-4 text-base',
      },
      shape: {
        default: 'rounded-md',
        pill: 'rounded-xl', // Softer corners for larger element
        asymmetric: 'rounded-[8px_2px_8px_2px]', // Uneven corners
        square: 'rounded-none',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default',
      resize: 'vertical',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, shape, resize, label, error, id, ...props }, ref) => {
    // Generate a unique ID for the textarea if not provided
    // React hooks must be called at the top level, not conditionally
    const uniqueId = React.useId();
    const textareaId = id || uniqueId;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-foreground block pl-1">
            {label}
          </label>
        )}

        <textarea
          id={textareaId}
          className={cn(
            textareaVariants({
              variant,
              size,
              shape,
              resize,
              className,
            }),
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          ref={ref}
          {...props}
        />

        {error && <p className="text-xs text-destructive pl-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
