"use client";

import React from "react";
import { LogoDisplay } from "./logo-display";
import { AnimationType } from "@/lib/animation/types";

// Sample SVG for testing
const sampleSvg = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="none" />
  <circle cx="100" cy="100" r="80" fill="none" stroke="#ff4233" stroke-width="4" />
  <path d="M70 80 L130 120 M130 80 L70 120" stroke="#ff4233" stroke-width="8" stroke-linecap="round" />
</svg>
`;

// Sample animation CSS for testing
const sampleAnimationCSS = `
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

svg {
  animation: rotate 10s linear infinite;
}

svg circle {
  animation: pulse 2s ease-in-out infinite;
  transform-origin: center;
}
`;

// Sample logo variants
const sampleVariants = [
  {
    id: "original",
    name: "Original",
    svgCode: sampleSvg,
    type: "color"
  },
  {
    id: "monochrome",
    name: "Monochrome",
    svgCode: sampleSvg.replace(/#ff4233/g, "#000000"),
    type: "monochrome"
  },
  {
    id: "simplified",
    name: "Simplified",
    svgCode: `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="none" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#ff4233" stroke-width="4" />
    </svg>
    `,
    type: "simplified"
  }
];

export default function LogoDisplayTest() {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [selectedVariantId, setSelectedVariantId] = React.useState("original");
  
  const handleAnimationStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    console.log("Animation is now:", playing ? "playing" : "paused");
  };
  
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    console.log("Selected variant:", variantId);
  };
  
  const handleCustomizeRequest = (svgContent: string) => {
    console.log("Customize request with SVG:", svgContent.substring(0, 50) + "...");
    // In a real app, this would open a customization UI
    alert("Customization would open here with the current SVG content");
  };
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="mb-8">Logo Display Component Test</h1>
      
      <div className="space-y-8">
        {/* Basic example */}
        <div>
          <h2 className="mb-4">Basic Logo</h2>
          <LogoDisplay 
            svgContent={sampleSvg}
            title="Test Logo"
            description="A simple test logo for demonstration purposes"
          />
        </div>
        
        {/* Animated example */}
        <div>
          <h2 className="mb-4">Animated Logo</h2>
          <LogoDisplay 
            svgContent={sampleSvg}
            animationCSS={sampleAnimationCSS}
            animationType={AnimationType.SPIN}
            title="Animated Logo"
            description="Demonstrating animation capabilities"
            onAnimationStateChange={handleAnimationStateChange}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Animation is currently: {isPlaying ? "Playing" : "Paused"}
          </p>
        </div>
        
        {/* Variants example */}
        <div>
          <h2 className="mb-4">Logo Variants</h2>
          <LogoDisplay 
            svgContent={sampleSvg}
            variants={sampleVariants}
            title="Logo with Variants"
            description="Showing different logo variants"
            onVariantSelect={handleVariantSelect}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Selected variant: {selectedVariantId}
          </p>
        </div>
        
        {/* Customizable example */}
        <div>
          <h2 className="mb-4">Customizable Logo</h2>
          <LogoDisplay 
            svgContent={sampleSvg}
            title="Customizable Logo"
            description="With customization option"
            onCustomizeRequest={handleCustomizeRequest}
          />
        </div>
        
        {/* States examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="mb-4">Loading State</h2>
            <LogoDisplay 
              isGenerating={true}
            />
          </div>
          
          <div>
            <h2 className="mb-4">Error State</h2>
            <LogoDisplay 
              hasError={true}
              errorMessage="Failed to generate logo due to server error"
            />
          </div>
        </div>
      </div>
    </div>
  );
}