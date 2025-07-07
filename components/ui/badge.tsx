import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Badge variants following asymmetric design principles
const badgeVariants = cva(
  // Base badge styles
  [
    'inline-flex items-center text-xs font-medium transition-all',
    'duration-quick focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-1',
  ],
  {
    variants: {
      variant: {
        // Default badge
        default: ['border border-border bg-background text-foreground'],

        // Primary with accent color
        primary: ['border-none bg-transparent text-accent border border-accent'],

        // Secondary (subtle gray)
        secondary: ['border-none bg-secondary text-secondary-foreground'],

        // Destructive
        destructive: ['border-none bg-destructive text-destructive-foreground'],

        // Outline style
        outline: ['border border-input bg-background text-foreground'],

        // Accent style with full accent background
        accent: ['border-none bg-accent text-accent-foreground'],

        // Asymmetric style with offset shadow
        asymmetric: [
          'bg-background border border-border text-foreground',
          'shadow-accent-sm transform -translate-x-[1px] -translate-y-[1px]',
        ],

        // Status indicators
        success: ['border-none bg-[#e6f6e6] text-[#0d730d]'],
        warning: ['border-none bg-[#fff8e6] text-[#a66600]'],
        info: ['border-none bg-[#e6f0ff] text-[#0050cc]'],
      },
      shape: {
        default: 'rounded-md px-2.5 py-0.5',
        pill: 'rounded-full px-2.5 py-0.5',
        asymmetric: 'rounded-[4px_1px_4px_2px] px-3 py-1', // Uneven corners
        accent: 'clip-asymmetric-1 px-2.5 py-0.5', // Using clip path from globals.css
        tag: 'rounded-[4px_12px_4px_4px] pl-2.5 pr-3 py-0.5', // Tag-like shape
      },
      size: {
        default: 'text-xs',
        sm: 'text-[10px] px-2 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
      animation: {
        none: '',
        pulse: 'animate-accent-pulse', // Subtle pulsing effect for important badges
      },
    },
    defaultVariants: {
      variant: 'default',
      shape: 'default',
      size: 'default',
      animation: 'none',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, size, animation, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, shape, size, animation, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
