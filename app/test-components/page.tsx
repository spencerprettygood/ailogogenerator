'use client'

import React from 'react'
import ThemedLayout from '@/components/providers/theme-fixed'
import LogoDisplay from '@/components/logo-generator/logo-display'
import { Card } from '@/components/ui/card'

const TEST_SVG = `<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="white"/>
  <circle cx="150" cy="150" r="100" fill="#3B82F6"/>
  <path d="M150 70C185.899 70 215 99.1015 215 135C215 170.899 185.899 200 150 200C114.101 200 85 170.899 85 135C85 99.1015 114.101 70 150 70ZM150 90C125.147 90 105 110.147 105 135C105 159.853 125.147 180 150 180C174.853 180 195 159.853 195 135C195 110.147 174.853 90 150 90Z" fill="white"/>
  <rect x="140" y="210" width="20" height="60" rx="10" fill="white"/>
</svg>`

const TEST_ANIMATION_CSS = `
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

#svg-container svg circle {
  animation: pulse 2s infinite;
}
`

export default function TestComponentsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Component Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Logo Display</h2>
          <LogoDisplay 
            svgContent={TEST_SVG}
            title="Test Logo"
            description="A simple test logo"
          />
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Animated Logo Display</h2>
          <LogoDisplay 
            svgContent={TEST_SVG}
            animationCSS={TEST_ANIMATION_CSS}
            title="Animated Logo"
            description="A simple animated test logo"
          />
        </Card>
      </div>
    </div>
  )
}