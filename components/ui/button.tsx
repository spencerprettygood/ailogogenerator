"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Button variants following design specification
const buttonVariants = cva(
  // Base button styles
  [
    "inline-flex items-center justify-center whitespace-nowrap font-medium",
    "transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        // Primary (outline + accent text)
        primary: [
          "border border-border text-accent bg-transparent",
          "hover:border-accent hover:shadow-accent-sm",
          "active:transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        ],
        
        // Secondary (gray)
        secondary: [
          "text-foreground bg-background border border-input",
          "hover:bg-muted hover:border-accent/30",
        ],
        
        // Ghost
        ghost: [
          "text-foreground bg-transparent hover:bg-muted",
        ],
        
        // Destructive
        destructive: [
          "text-accent border border-accent",
          "hover:bg-accent/10",
        ],
        
        // Accent corner
        accent: [
          "relative bg-background text-foreground border border-foreground overflow-hidden",
          "after:content-[''] after:absolute after:top-0 after:right-0 after:w-5 after:h-5",
          "after:bg-accent after:clip-path-triangle",
          "hover:border-accent",
        ],
        
        // Asymmetric
        asymmetric: [
          "border border-foreground bg-background text-foreground",
          "shadow-accent transform -translate-x-[1px] -translate-y-[1px]",
          "hover:shadow-accent-sm hover:translate-x-0 hover:translate-y-0",
          "active:shadow-none active:translate-x-[1px] active:translate-y-[1px]",
        ],
        
        // Link
        link: [
          "text-accent underline-offset-4 hover:underline",
          "p-0 h-auto",
        ],
        
        // Default and outline (for compatibility)
        default: [
          "bg-foreground text-background",
          "hover:bg-foreground/90",
        ],
        
        outline: [
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        ],
      },
      size: {
        default: "px-4 py-2 text-base",
        sm: "px-3 py-1.5 text-sm",
        lg: "px-6 py-3 text-lg",
        icon: "h-9 w-9",
      },
      radius: {
        default: "rounded-md",
        none: "rounded-none",
        full: "rounded-full",
        asymmetric: "rounded-asymmetric",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      radius: "default",
    },
  }
);

// Button props interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

import { Slot } from "@radix-ui/react-slot";

// Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, radius, asChild = false, ...props }, ref) => {
    // Using the Slot pattern allows button to be polymorphic
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, radius, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };