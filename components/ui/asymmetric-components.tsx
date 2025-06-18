import React, { ReactNode, ButtonHTMLAttributes } from 'react';

// Asymmetric button with offset shadow
interface AsymmetricButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function AsymmetricButton({
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: AsymmetricButtonProps) {
  // Base styles for all buttons
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-standard ease-asymmetric';
  
  // Size variants
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // Button variants
  const variantStyles = {
    default: 'bg-white text-foreground shadow-accent hover:translate-x-0 hover:translate-y-0 hover:shadow-accent-light active:translate-x-1 active:translate-y-1 active:shadow-none transform -translate-x-1 -translate-y-1',
    accent: 'bg-accent text-white hover:bg-accent-dark hover:-translate-y-1 active:translate-y-0 clip-asymmetric-1',
    outline: 'bg-transparent text-foreground border border-gray-300 hover:border-accent',
    text: 'bg-transparent text-foreground hover:text-accent underline-offset-4 hover:underline'
  };
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Asymmetric card with uneven corners and accent details
interface AsymmetricCardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'accent-corner' | 'accent-border';
  className?: string;
}

export function AsymmetricCard({
  children,
  variant = 'default',
  className = ''
}: AsymmetricCardProps) {
  // Base styles for all cards
  const baseStyles = 'bg-white relative overflow-hidden';
  
  // Card variants
  const variantStyles = {
    default: 'rounded-uneven p-4 border border-gray-200',
    elevated: 'rounded-asymmetric p-4 shadow-asymmetric-md',
    'accent-corner': 'rounded-asymmetric p-4 shadow-asymmetric-sm after:content-[""] after:absolute after:top-0 after:right-0 after:w-5 after:h-5 after:bg-accent after:clip-path-triangle',
    'accent-border': 'rounded-md p-4 border-t-0 border-r-2 border-b-2 border-l-0 border-accent shadow-asymmetric-sm'
  };
  
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

// Input with asymmetric styling
interface AsymmetricInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export function AsymmetricInput({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}: AsymmetricInputProps) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block mb-2 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full px-4 py-2 bg-white border border-gray-300
            focus:border-accent focus:ring-1 focus:ring-accent
            rounded-asymmetric transition-all duration-standard
            ${error ? 'border-destructive' : ''}
            ${className}
          `}
          {...props}
        />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-accent transform rotate-45 z-[-1]"></div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Textarea with asymmetric styling
interface AsymmetricTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export function AsymmetricTextarea({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}: AsymmetricTextareaProps) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block mb-2 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          className={`
            w-full px-4 py-2 bg-white border border-gray-300
            focus:border-accent focus:ring-1 focus:ring-accent
            rounded-asymmetric transition-all duration-standard
            ${error ? 'border-destructive' : ''}
            ${className}
          `}
          {...props}
        />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-accent transform rotate-45 z-[-1]"></div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Badge with asymmetric design
interface AsymmetricBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'outline';
  className?: string;
}

export function AsymmetricBadge({
  children,
  variant = 'default',
  className = ''
}: AsymmetricBadgeProps) {
  // Badge variants
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    accent: 'bg-accent text-white',
    outline: 'bg-white border border-accent text-accent'
  };
  
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 text-xs font-medium
      clip-asymmetric-1 transform -rotate-1
      ${variantStyles[variant]} ${className}
    `}>
      {children}
    </span>
  );
}

// Alert component with asymmetric design
interface AsymmetricAlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export function AsymmetricAlert({
  children,
  variant = 'info',
  className = ''
}: AsymmetricAlertProps) {
  // Alert variants
  const variantStyles = {
    info: 'bg-blue-50 border-l-4 border-blue-400 text-blue-700',
    success: 'bg-green-50 border-l-4 border-green-400 text-green-700',
    warning: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700',
    error: 'bg-accent/10 border-l-4 border-accent text-foreground'
  };
  
  return (
    <div className={`
      p-4 rounded-tr-md rounded-br-md clip-asymmetric-2
      ${variantStyles[variant]} ${className}
    `}>
      {children}
    </div>
  );
}

// Progress indicator with asymmetric styling
interface AsymmetricProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'accent';
  className?: string;
}

export function AsymmetricProgress({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  className = ''
}: AsymmetricProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Progress variants
  const variantStyles = {
    default: 'bg-gray-200',
    accent: 'bg-accent/20'
  };
  
  const progressBarStyles = {
    default: 'bg-gray-700',
    accent: 'bg-accent'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          {showValue && (
            <span className="text-sm font-medium text-gray-500">{value}/{max}</span>
          )}
        </div>
      )}
      <div className={`w-full h-2 rounded-sm overflow-hidden ${variantStyles[variant]}`}>
        <div 
          className={`h-full clip-asymmetric-1 ${progressBarStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Tabs with asymmetric styling
interface AsymmetricTabsProps {
  tabs: {
    id: string;
    label: string;
  }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function AsymmetricTabs({
  tabs,
  activeTab,
  onChange,
  className = ''
}: AsymmetricTabsProps) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <div className="flex space-x-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              py-2 px-1 text-sm font-medium whitespace-nowrap
              border-b-2 -mb-px transform hover:-translate-y-1 transition-transform
              ${activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'}
            `}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}