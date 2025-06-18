'use client'

import React from 'react';
import { LogoGeneratorApp } from '@/components/logo-generator/logo-generator-app';
import { HydrationSafeProvider } from '@/components/providers/hydration-safe-provider';

/**
 * Client-side HomePage component
 * 
 * This component wraps the LogoGeneratorApp in a HydrationSafeProvider
 * to prevent hydration mismatches when server and client renders differ.
 * 
 * The main HomePage in app/page.tsx is a server component that imports this client component.
 */
export default function ClientHomePage() {
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