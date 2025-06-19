'use client'

import React from 'react';
import { LogoGeneratorApp } from '@/components/logo-generator/logo-generator-app';
import { HydrationSafeProvider } from '@/components/providers/hydration-safe-provider';

/**
 * Client-side wrapper for the LogoGeneratorApp
 * 
 * This component creates a clear client/server boundary and 
 * wraps the app in a HydrationSafeProvider to prevent mismatches.
 */
export default function LogoGeneratorWrapper() {
  return (
    <div className="min-h-screen bg-background">
      <HydrationSafeProvider fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-center">
            <p className="text-muted-foreground">Loading logo generator...</p>
          </div>
        </div>
      }>
        <LogoGeneratorApp />
      </HydrationSafeProvider>
    </div>
  );
}