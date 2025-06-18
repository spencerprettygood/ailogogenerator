import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'accent' | 'asymmetric'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-background text-foreground border border-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-destructive text-destructive-foreground',
    outline: 'bg-background border-input text-foreground border',
    accent: 'border-transparent bg-accent text-accent-foreground',
    asymmetric: 'bg-background border border-accent text-foreground'
  }

  // Get the proper shape based on variant
  const getShape = () => {
    if (variant === 'asymmetric') return 'rounded-accent';
    if (variant === 'accent') return 'clip-asymmetric-1';
    return 'rounded-md'; // Changed from rounded-full for asymmetric design
  }

  return (
    <div
      className={cn(
        'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold',
        'transition-all duration-quick focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-1',
        getShape(),
        variants[variant!],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
