import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'asymmetric' | 'accent'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'border border-input bg-background text-foreground hover:border-accent hover:text-accent transition-all duration-standard',
      destructive: 'text-white bg-destructive hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:border-accent hover:text-accent',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:text-accent',
      link: 'text-accent underline-offset-4 hover:underline',
      // New asymmetric variants
      asymmetric: 'btn-asymmetric border border-foreground',
      accent: 'btn-accent'
    }

    const sizes = {
      default: 'px-4 py-2',
      sm: 'px-3 py-1.5 text-sm',
      lg: 'px-6 py-3',
      icon: 'h-10 w-10'
    }

    // Border radius varies by variant for asymmetric look
    const getBorderRadius = () => {
      if (variant === 'asymmetric' || variant === 'accent') return '';
      if (variant === 'default' || variant === 'outline') return 'rounded-asymmetric';
      return 'rounded-md';
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium',
          'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:pointer-events-none',
          getBorderRadius(),
          variants[variant!],
          sizes[size!],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
