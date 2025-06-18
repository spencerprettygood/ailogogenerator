'use client'

import React from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { LogoDisplayTest } from './logo-display-test'

export default function TestComponentsPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Component Test Page</h1>
        <p className="mb-8">Testing the LogoDisplay component with various configurations:</p>
        <LogoDisplayTest />
      </div>
    </ThemeProvider>
  )
}