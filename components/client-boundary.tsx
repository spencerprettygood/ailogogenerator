'use client'

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues
const LogoGeneratorWrapper = dynamic(
  () => import('@/components/logo-generator-wrapper'),
  { ssr: false }
);

/**
 * Client Boundary Component
 * 
 * This component serves as a proper client/server boundary.
 * It dynamically imports the LogoGeneratorWrapper with ssr: false
 * to ensure it only renders on the client side.
 */
export default function ClientBoundary() {
  return <LogoGeneratorWrapper />;
}