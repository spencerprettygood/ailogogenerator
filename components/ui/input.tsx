'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Input variants following asymmetric design principles
const inputVariants = cva(
  // Base input styles
  [
    "flex w-full bg-background text-foreground text-sm transition-all",
    "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "ring-offset-background focus-visible:outline-none",
  ],
  {
    variants: {
      variant: {
        // Default with border
        default: [
          "border border-input",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        ],
        
        // Accent border
        accent: [
          "border border-accent/50",
          "focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent",
        ],
        
        // Asymmetric with offset shadow
        asymmetric: [
          "border border-input shadow-[3px_3px_0_0_hsl(var(--accent))]",
          "transform -translate-x-[1px] -translate-y-[1px]",
          "focus-visible:translate-x-0 focus-visible:translate-y-0",
          "focus-visible:shadow-[1px_1px_0_0_hsl(var(--accent))]",
        ],
        
        // Minimal with underline only
        minimal: [
          "border-b-2 border-input rounded-none px-1 py-2",
          "focus-visible:border-b-accent",
        ],
        
        // Filled background
        filled: [
          "border-0 bg-input",
          "focus-visible:bg-input/80 focus-visible:ring-1 focus-visible:ring-accent",
        ],
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
        icon: "h-10 w-10 px-0 text-center",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
        asymmetric: "rounded-[4px_1px_4px_2px]", // Uneven corners
        square: "rounded-none",
      },
      withIcon: {
        left: "pl-9", // Space for left icon
        right: "pr-9", // Space for right icon
        both: "px-9", // Space for icons on both sides
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
      withIcon: "none",
    },
  }
);

export interface InputProps 
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconClass?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    size, 
    shape, 
    withIcon,
    icon,
    iconPosition = "left",
    iconClass,
    ...props 
  }, ref) => {
    // Determine if we need icon positioning
    const effectiveWithIcon = icon ? (iconPosition === "right" ? "right" : "left") : withIcon;
    
    return (
      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", 
            iconClass
          )}>
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ 
              variant, 
              size, 
              shape, 
              withIcon: effectiveWithIcon,
              className 
            })
          )}
          ref={ref}
          {...props}
        />
        
        {icon && iconPosition === "right" && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",
            iconClass
          )}>
            {icon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };