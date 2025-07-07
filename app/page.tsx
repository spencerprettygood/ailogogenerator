'use client';

import React from 'react';
import { LogoGeneratorApp } from '@/components/logo-generator/logo-generator-app';
import { usePageTracking } from '@/lib/telemetry';

export default function HomePage() {
  // Track page views
  usePageTracking('home', { source: 'direct' });

  return <LogoGeneratorApp />;
}
