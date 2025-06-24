'use client'

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { createErrorBoundaryHandler } from '@/lib/utils/error-handler';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName: string;
  resetOnUpdate?: boolean;
  containerClassName?: string;
}

/**
 * A wrapper around the ErrorBoundary component that integrates with our 
 * standardized error handling system. This component automatically 
 * creates an error handler with the appropriate component name.
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  componentName,
  resetOnUpdate = false,
  containerClassName
}: ErrorBoundaryWrapperProps) {
  // Create an error handler that's integrated with our error reporting system
  const errorHandler = createErrorBoundaryHandler(componentName);
  
  return (
    <ErrorBoundary 
      onError={errorHandler}
      fallback={fallback}
      resetOnUpdate={resetOnUpdate}
      containerClassName={containerClassName}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundaryWrapper;