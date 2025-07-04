'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, ArrowLeft, Send } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  componentStack?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnUpdate?: boolean;
  containerClassName?: string;
}

/**
 * Production-ready error boundary component that catches errors in any child component
 * and displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Store errorInfo for display
    this.setState({ errorInfo, componentStack: errorInfo.componentStack ?? undefined });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      import('@/lib/utils/error-reporter').then(module => {
        const errorReporter = module.default;
        errorReporter.reportError(error, {
          component: errorInfo.componentStack ?? undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        });
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if children have changed and resetOnUpdate is true
    if (
      this.state.hasError &&
      this.props.resetOnUpdate &&
      prevProps.children !== this.props.children
    ) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  }

  // Helper function to reset the error state
  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  // Helper function to report the error
  handleReportError = () => {
    if (this.state.error) {
      // Use the error reporter service
      import('@/lib/utils/error-reporter').then(module => {
        const errorReporter = module.default;
        
        errorReporter.reportError(this.state.error!, {
          component: this.state.componentStack,
          url: window.location.href,
          additionalInfo: {
            userReported: true,
            timestamp: new Date().toISOString()
          }
        });
        
        // Also capture user feedback
        errorReporter.submitFeedback('User manually reported error', {
          url: window.location.href
        });
        
        alert('Error reported. Thank you for helping improve the application.');
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className={`${this.props.containerClassName || 'min-h-screen bg-background flex items-center justify-center p-4'}`}>
          <Card className="w-full max-w-md border-destructive/20 shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2">
                <div className="bg-destructive/10 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-center">Something went wrong</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                The application encountered an unexpected error. You can try refreshing the page or
                going back to the previous screen.
              </p>
              
              {/* Show error details in development or if manually enabled */}
              {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_ERROR_DETAILS === 'true') && 
                this.state.error && (
                <details className="text-xs bg-muted p-3 rounded border">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <div className="mt-2 overflow-auto">
                    <p className="font-semibold text-destructive mt-2">Message:</p>
                    <pre className="p-2 bg-muted/50 rounded">{this.state.error.message}</pre>
                    
                    {this.state.error.stack && (
                      <>
                        <p className="font-semibold text-destructive mt-2">Stack Trace:</p>
                        <pre className="p-2 bg-muted/50 rounded max-h-40 overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </>
                    )}
                    
                    {this.state.componentStack && (
                      <>
                        <p className="font-semibold text-destructive mt-2">Component Stack:</p>
                        <pre className="p-2 bg-muted/50 rounded max-h-40 overflow-auto">
                          {this.state.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
            
            <CardFooter className="flex-col space-y-2">
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={this.handleReportError}
                className="w-full text-sm text-muted-foreground"
              >
                <Send className="h-3 w-3 mr-2" />
                Report this issue
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
