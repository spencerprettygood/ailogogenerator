'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

// Enhanced button variants following the monochrome + #FF4233 accent design specification
const buttonVariants = cva(
  // Base button styles with improved accessibility and transitions
  [
    'inline-flex items-center justify-center whitespace-nowrap',
    'font-medium select-none',
    'transition-all duration-standard ease-asymmetric',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:pointer-events-none',
    'aria-disabled:opacity-50 aria-disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        // Primary (monochrome with accent details)
        primary: [
          'border border-border text-accent bg-background',
          'hover:border-accent hover:shadow-accent-sm hover:translate-y-[-1px]',
          'active:transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
          'dark:bg-muted dark:border-muted-foreground dark:hover:border-accent',
        ],

        // Secondary (monochrome subtle)
        secondary: [
          'text-foreground bg-background border border-input',
          'hover:bg-muted hover:border-accent/30 hover:text-accent/90',
          'active:bg-muted/80',
          'dark:bg-muted dark:border-muted-foreground dark:text-foreground',
        ],

        // Ghost (transparent)
        ghost: [
          'text-foreground bg-transparent',
          'hover:bg-muted/50 hover:text-accent',
          'active:bg-muted/70',
          'dark:text-foreground dark:hover:bg-muted/20',
        ],

        // Destructive (accent color for warnings/destructive actions)
        destructive: [
          'text-accent border border-accent',
          'hover:bg-accent/10 hover:border-accent/80',
          'active:bg-accent/20',
          'dark:border-accent/80 dark:hover:bg-accent/20',
        ],

        // Accent corner (asymmetric accent detail)
        accent: [
          'relative bg-background text-foreground border border-foreground overflow-hidden',
          "after:content-[''] after:absolute after:top-0 after:right-0 after:w-5 after:h-5",
          'after:bg-accent after:clip-path-triangle',
          'hover:border-accent hover:translate-y-[-1px] hover:shadow-sm',
          'active:translate-y-0 active:shadow-none',
          'dark:bg-muted dark:border-muted-foreground dark:text-foreground',
        ],

        // Asymmetric (offset shadow style - signature style)
        asymmetric: [
          'border border-foreground bg-background text-foreground',
          'shadow-accent transform -translate-x-[1px] -translate-y-[1px]',
          'hover:shadow-accent-sm hover:translate-x-0 hover:translate-y-0',
          'active:shadow-none active:translate-x-[1px] active:translate-y-[1px]',
          'dark:bg-muted dark:border-muted-foreground dark:text-foreground',
          'dark:shadow-accent dark:hover:shadow-accent-sm',
        ],

        // Solid (full accent background)
        solid: [
          'bg-accent text-accent-foreground border border-transparent',
          'hover:bg-accent-dark hover:translate-y-[-1px] hover:shadow-sm',
          'active:translate-y-0 active:shadow-none active:bg-accent',
          'dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent-light',
        ],

        // Link style
        link: [
          'text-accent underline-offset-4 hover:underline',
          'p-0 h-auto',
          'dark:text-accent-light',
        ],

        // Legacy variants (for backward compatibility)
        default: [
          'bg-foreground text-background',
          'hover:bg-foreground/90 hover:translate-y-[-1px]',
          'dark:bg-foreground dark:text-background',
        ],

        outline: [
          'border border-input bg-background',
          'hover:bg-accent/10 hover:text-accent hover:border-accent',
          'dark:bg-muted dark:border-muted-foreground dark:hover:border-accent',
        ],
      },
      size: {
        default: 'px-4 py-2 text-base',
        sm: 'px-3 py-1.5 text-sm',
        lg: 'px-6 py-3 text-lg',
        icon: 'h-9 w-9 p-0',
        xl: 'px-8 py-4 text-xl',
      },
      radius: {
        default: 'rounded-md',
        none: 'rounded-none',
        full: 'rounded-full',
        asymmetric: 'rounded-asymmetric',
        uneven: 'rounded-uneven',
      },
      width: {
        default: '',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      radius: 'default',
      width: 'default',
    },
  }
);

// Enhanced Button props interface with improved typing
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Enhanced Button component with additional features
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      radius,
      width,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    // Using the Slot pattern allows button to be polymorphic
    const Comp = asChild ? Slot : 'button';

    // Create an ID for the loading state for accessibility
    const loadingId = React.useId();

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, radius, width, className }))}
        ref={ref}
        aria-busy={isLoading ? 'true' : undefined}
        aria-describedby={isLoading ? loadingId : undefined}
        data-state={isLoading ? 'loading' : undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="sr-only" id={loadingId}>
              Loading, please wait
            </span>
            <span className="inline-flex items-center justify-center gap-x-1.5">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {loadingText || children}
            </span>
          </>
        ) : (
          <span className="inline-flex items-center justify-center gap-x-1.5">
            {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-1.5">{rightIcon}</span>}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
