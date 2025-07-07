import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function H1({ children, className = '' }: TypographyProps) {
  return <h1 className={`heading-1 ${className}`}>{children}</h1>;
}

export function H2({ children, className = '' }: TypographyProps) {
  return <h2 className={`heading-2 ${className}`}>{children}</h2>;
}

export function H3({ children, className = '' }: TypographyProps) {
  return <h3 className={`heading-3 ${className}`}>{children}</h3>;
}

export function H4({ children, className = '' }: TypographyProps) {
  return <h4 className={`heading-4 ${className}`}>{children}</h4>;
}

export function H5({ children, className = '' }: TypographyProps) {
  return <h5 className={`heading-5 ${className}`}>{children}</h5>;
}

export function H6({ children, className = '' }: TypographyProps) {
  return <h6 className={`heading-6 ${className}`}>{children}</h6>;
}

export function Paragraph({ children, className = '' }: TypographyProps) {
  return <p className={`body-normal ${className}`}>{children}</p>;
}

export function LargeText({ children, className = '' }: TypographyProps) {
  return <p className={`body-large ${className}`}>{children}</p>;
}

export function SmallText({ children, className = '' }: TypographyProps) {
  return <p className={`body-small ${className}`}>{children}</p>;
}

export function Caption({ children, className = '' }: TypographyProps) {
  return <span className={`caption ${className}`}>{children}</span>;
}

// Specialized components
export function GradientHeading({ children, className = '' }: TypographyProps) {
  return <h2 className={`heading-2 heading-gradient ${className}`}>{children}</h2>;
}

export function AccentHeading({ children, className = '' }: TypographyProps) {
  return <h3 className={`heading-3 heading-underline ${className}`}>{children}</h3>;
}
