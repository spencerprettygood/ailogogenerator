'use client'

import React from 'react';
import { LogoGeneratorApp } from '@/components/logo-generator/logo-generator-app';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* We're using the LogoGeneratorApp component which now has a Perplexity-style interface */}
      <LogoGeneratorApp />
    </div>
  );
}
