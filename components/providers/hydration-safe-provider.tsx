'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface HydrationSafeProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * HydrationSafeProvider Component
 *
 * This component prevents hydration mismatches by only rendering its children
 * after the component has mounted on the client side. This is useful for components
 * that rely on browser APIs or window object.
 *
 * @param props - Component props
 * @param props.children - The components to render after hydration
 * @param props.fallback - Optional fallback to show during server rendering
 * @returns A component that safely renders after hydration
 */
export function HydrationSafeProvider({ children, fallback = null }: HydrationSafeProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and first client render, show fallback
  if (!isMounted) {
    return <>{fallback}</>;
  }

  // After hydration is complete, show actual children
  return <>{children}</>;
}
