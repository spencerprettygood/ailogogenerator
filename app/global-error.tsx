'use client'

import React, { useEffect } from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

/**
 * Global error handler for Next.js 15 root layout errors
 * This component is only used when the root layout throws an error
 * 
 * According to Next.js 15 docs, global-error.tsx:
 * 1. Must be a client component
 * 2. Must define a root html and body since it replaces the entire page
 * 3. Should be used sparingly, as error.tsx is preferred in most cases
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log error to console and potentially to an error reporting service
  useEffect(() => {
    console.error('Root layout error caught by global-error.tsx:', error)
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // reportError(error);
    }
  }, [error])

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-red-500 dark:text-red-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Critical Application Error
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The application encountered a critical error and cannot continue.
            </p>
            
            {/* Show error details in development or if manually enabled */}
            {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_ERROR_DETAILS === 'true') && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-left mb-6 text-sm overflow-auto max-h-40">
                <p className="font-semibold text-red-500 mb-1">Error: {error.message}</p>
                {error.digest && <p className="text-gray-500">Digest: {error.digest}</p>}
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => reset()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              >
                Try to Recover
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}