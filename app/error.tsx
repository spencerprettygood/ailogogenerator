'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Send } from 'lucide-react'

/**
 * Global error handler for Next.js 15
 * This component catches errors in the app directory routes
 * 
 * According to Next.js 15 docs, error.tsx files must:
 * 1. Be client components ('use client' directive)
 * 2. Accept error and reset props
 * 3. Handle the error gracefully
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log error to console and potentially to an error reporting service
  useEffect(() => {
    console.error('Route error caught by error.tsx:', error)
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // reportError(error);
    }
  }, [error])

  // Helper function to report the error
  const handleReportError = () => {
    // Example implementation for error reporting
    const errorData = {
      message: error?.message,
      stack: error?.stack,
      digest: error?.digest,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
    
    console.log('Reporting error:', errorData)
    
    // In a real app, you would send this to your error reporting service
    // Example: fetch('/api/report-error', { method: 'POST', body: JSON.stringify(errorData) });
    
    alert('Error reported. Thank you for helping improve the application.')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
            The application encountered an unexpected error. You can try resetting the application or
            refreshing the page.
          </p>
          
          {/* Show error details in development or if manually enabled */}
          {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_ERROR_DETAILS === 'true') && (
            <details className="text-xs bg-muted p-3 rounded border">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <div className="mt-2 overflow-auto">
                <p className="font-semibold text-destructive mt-2">Message:</p>
                <pre className="p-2 bg-muted/50 rounded">{error.message}</pre>
                
                {error.stack && (
                  <>
                    <p className="font-semibold text-destructive mt-2">Stack Trace:</p>
                    <pre className="p-2 bg-muted/50 rounded max-h-40 overflow-auto">
                      {error.stack}
                    </pre>
                  </>
                )}
                
                {error.digest && (
                  <>
                    <p className="font-semibold text-destructive mt-2">Error Digest:</p>
                    <pre className="p-2 bg-muted/50 rounded">
                      {error.digest}
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
              onClick={() => reset()}
              className="flex-1"
            >
              Reset Application
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
            onClick={handleReportError}
            className="w-full text-sm text-muted-foreground"
          >
            <Send className="h-3 w-3 mr-2" />
            Report this issue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}