import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Progress variants following asymmetric design principles
const progressVariants = cva(
  // Base progress styles
  [
    "relative overflow-hidden w-full",
    "bg-secondary/50 dark:bg-secondary/25",
  ],
  {
    variants: {
      variant: {
        // Default progress
        default: [
          "rounded-md",
        ],
        
        // Accent progress with accent color
        accent: [
          "rounded-md",
          "[&>div]:bg-accent",
        ],
        
        // Asymmetric with uneven corners
        asymmetric: [
          "rounded-[4px_1px_4px_2px]",
          "[&>div]:origin-left [&>div]:skew-x-3",
        ],
        
        // Pipeline progress for logo generation stages
        pipeline: [
          "rounded-md border border-input",
          "[&>div]:bg-accent/80 [&>div]:backdrop-blur-sm",
          "after:absolute after:inset-0 after:content-[''] after:bg-gradient-to-r after:from-transparent after:via-accent/10 after:to-transparent after:opacity-0",
          "hover:after:opacity-100 hover:after:animate-[shimmer_2s_infinite]",
        ],
        
        // Indeterminate loading state
        indeterminate: [
          "rounded-md overflow-hidden",
          "[&>div]:animate-indeterminate-progress [&>div]:w-[50%]",
        ],
        
        // Segmented for multi-stage processes
        segmented: [
          "rounded-md grid [&>div]:col-start-1 [&>div]:row-start-1 [&>div]:rounded-none",
          "border border-border divide-x divide-border/30",
        ],
      },
      size: {
        default: "h-4",
        xs: "h-1",
        sm: "h-2",
        md: "h-3",
        lg: "h-5",
        xl: "h-6",
      },
      animation: {
        default: "[&>div]:transition-all [&>div]:duration-500",
        smooth: "[&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-in-out",
        instant: "",
        pulse: "[&>div]:animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "default",
    },
  }
);

export interface ProgressProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  segments?: number;
  activeSegment?: number;
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    variant,
    size,
    animation,
    showValue = false,
    valuePrefix = "",
    valueSuffix = "%",
    segments = 1,
    activeSegment = 0,
    label,
    ...props 
  }, ref) => {
    // Calculate the percentage complete
    const percentage = (value / max) * 100;
    
    // Format the displayed value
    const displayValue = `${valuePrefix}${Math.round(percentage)}${valueSuffix}`;
    
    // Segmented progress special case
    const isSegmented = variant === 'segmented' && segments > 1;
    
    return (
      <div className="w-full space-y-1">
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-1 text-xs">
            {label && <span className="text-foreground">{label}</span>}
            {showValue && (
              <span className="text-muted-foreground">{displayValue}</span>
            )}
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(
            progressVariants({ variant, size, animation }),
            isSegmented && `grid-cols-${segments}`,
            className
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          {...props}
        >
          {isSegmented ? (
            // Render segmented progress
            Array.from({ length: segments }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-full transition-colors",
                  index === activeSegment 
                    ? "bg-accent animate-pulse" 
                    : index < activeSegment 
                      ? "bg-accent/80" 
                      : "bg-secondary/20"
                )}
                style={{
                  width: `${100 / segments}%`,
                  gridColumn: `${index + 1}`
                }}
              />
            ))
          ) : (
            // Render standard progress bar
            <div
              className={cn(
                "h-full w-full flex-1 bg-primary",
                variant === 'indeterminate' ? 'animate-indeterminate-progress' : ''
              )}
              style={
                variant !== 'indeterminate' 
                  ? { transform: `translateX(-${100 - percentage}%)` }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress, progressVariants };