import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Card variants following asymmetric design principles
const cardVariants = cva(
  // Base card styles
  [
    "relative overflow-hidden",
    "transition-all duration-standard",
    "bg-card text-card-foreground"
  ],
  {
    variants: {
      variant: {
        // Default with subtle shadow and border
        default: [
          "border border-border shadow-sm",
          "rounded-lg",
        ],
        
        // Asymmetric with off-center radius and accent corner
        asymmetric: [
          "border border-border shadow-asymmetric-md",
          "rounded-[8px_2px_8px_2px]",
          "after:content-[''] after:absolute after:top-0 after:right-0 after:w-5 after:h-5",
          "after:bg-accent after:clip-path-[polygon(0_0,100%_0,100%_100%)]",
        ],
        
        // Offset border with accent shadow
        accent: [
          "border border-border rounded-md",
          "shadow-accent transform -translate-x-[1px] -translate-y-[1px]",
          "hover:shadow-accent-sm hover:translate-x-0 hover:translate-y-0",
        ],
        
        // Gradient background with subtle asymmetric pattern
        gradient: [
          "border-none rounded-lg shadow-sm",
          "bg-asymmetric-gradient-1",
        ],
        
        // Elevated with stronger shadow
        elevated: [
          "border border-border rounded-lg",
          "shadow-asymmetric-lg",
        ],
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        uneven: "p-uneven" // Custom uneven padding from globals.css
      },
      animation: {
        none: "",
        fadeIn: "animate-off-center-fade",
        slideUp: "animate-slide-up-right",
        skewFade: "animate-skewed-fade",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      animation: "none",
    },
  }
);

interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, animation, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, animation, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      'flex flex-col space-y-1.5 pb-4',
      className
    )} 
    {...props} 
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-heading font-thin text-2xl tracking-wider leading-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('', className)} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  cardVariants 
};