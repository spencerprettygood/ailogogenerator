import React, { ReactNode } from 'react';

interface AsymmetricContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'inverse' | 'accent' | 'offset';
}

export function AsymmetricContainer({
  children,
  className = '',
  variant = 'default',
}: AsymmetricContainerProps) {
  // Base styles applied to all variants
  const baseStyles = 'relative overflow-hidden';

  // Variant-specific styles
  const variantStyles = {
    default: 'rounded-asymmetric bg-white p-6 shadow-asymmetric-md',
    inverse: 'rounded-asymmetric bg-foreground text-white p-6 shadow-asymmetric-md',
    accent:
      'rounded-asymmetric bg-white border-l-4 border-t-0 border-r-0 border-b-2 border-accent p-6 shadow-asymmetric-sm',
    offset: 'rounded-md bg-white p-6 shadow-accent',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {variant === 'default' && (
        <div className="absolute top-0 right-0 w-5 h-5 bg-accent clip-path-triangle" />
      )}
      {variant === 'accent' && <div className="absolute bottom-0 right-0 w-16 h-1 bg-accent" />}
      {children}
    </div>
  );
}

interface AsymmetricGridProps {
  children: ReactNode;
  className?: string;
  variant?: 'split-2-1' | 'split-1-2' | 'split-3-2-1' | 'split-1-3';
}

export function AsymmetricGrid({
  children,
  className = '',
  variant = 'split-2-1',
}: AsymmetricGridProps) {
  // Variant-specific grid layouts
  const variantStyles = {
    'split-2-1': 'grid-cols-1 md:grid-cols-asymmetric-1', // 2fr 1fr
    'split-1-2': 'grid-cols-1 md:grid-cols-asymmetric-2', // 1fr 2fr
    'split-3-2-1': 'grid-cols-1 md:grid-cols-asymmetric-3', // 3fr 2fr 1fr
    'split-1-3': 'grid-cols-1 md:grid-cols-asymmetric-4', // 1fr 3fr
  };

  return (
    <div className={`grid gap-4 md:gap-6 ${variantStyles[variant]} ${className}`}>{children}</div>
  );
}

interface AsymmetricSectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  accentPosition?: 'left' | 'right';
}

export function AsymmetricSection({
  children,
  className = '',
  title,
  subtitle,
  accentPosition = 'left',
}: AsymmetricSectionProps) {
  // Different accent marker positions
  const accentStyles = {
    left: 'border-l-4 border-accent pl-4 -ml-4',
    right: 'border-r-4 border-accent pr-4 -mr-4',
  };

  return (
    <section className={`mb-12 ${className}`}>
      {(title || subtitle) && (
        <div className={`mb-8 ${accentStyles[accentPosition]}`}>
          {title && <h2 className="text-2xl md:text-3xl mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

interface AsymmetricPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'corner-clip' | 'accent-border' | 'shadow-offset';
}

export function AsymmetricPanel({
  children,
  className = '',
  variant = 'corner-clip',
}: AsymmetricPanelProps) {
  // Variant-specific panel styles
  const variantStyles = {
    'corner-clip': 'clip-asymmetric-1 bg-white p-6 shadow-asymmetric-sm',
    'accent-border': 'border-l-0 border-t-2 border-r-2 border-b-0 border-accent p-5 bg-white',
    'shadow-offset': 'transform -translate-x-1 -translate-y-1 bg-white p-6 shadow-accent',
  };

  return <div className={`${variantStyles[variant]} ${className}`}>{children}</div>;
}

// Utility component for creating focus points with asymmetric highlight
export function AsymmetricHighlight({
  children,
  className = '',
  position = 'top-right',
}: {
  children: ReactNode;
  className?: string;
  position?: 'top-right' | 'bottom-left' | 'custom';
}) {
  const positionStyles = {
    'top-right': 'before:top-0 before:right-0 before:w-1/3 before:h-1/4',
    'bottom-left': 'before:bottom-0 before:left-0 before:w-1/3 before:h-1/4',
    custom: '', // For custom positioning via className
  };

  return (
    <div
      className={`
      relative 
      before:absolute before:bg-accent/10 before:rounded-sm before:-z-10
      ${positionStyles[position]} ${className}
    `}
    >
      {children}
    </div>
  );
}

// Utility component for off-center image with accent border
export function AsymmetricImage({
  src,
  alt,
  className = '',
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`relative z-10 transform -translate-x-2 -translate-y-2 ${className}`}
      />
      <div className="absolute top-0 left-0 w-full h-full border-2 border-accent"></div>
    </div>
  );
}
