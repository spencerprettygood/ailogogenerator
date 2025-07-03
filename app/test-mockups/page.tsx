'use client';

import React from 'react';
import { MockupPerformanceTest } from '@/components/logo-generator/mockup-performance-test';
import { EnhancedMockupIntegration } from '@/components/logo-generator/enhanced-mockup-integration';
import { TEST_SVG_LOGOS } from '@/lib/mockups/mockup-test-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestMockupsPage() {
  const [selectedLogo, setSelectedLogo] = React.useState<string>('simple');
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Enhanced Mockup System Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Logo Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(TEST_SVG_LOGOS).map(([key, svg]) => (
              <Button
                key={key}
                variant={selectedLogo === key ? 'default' : 'outline'}
                onClick={() => setSelectedLogo(key)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <EnhancedMockupIntegration
        logo={TEST_SVG_LOGOS[selectedLogo] || TEST_SVG_LOGOS.simple || ''}
        brandName={`Test ${selectedLogo.charAt(0).toUpperCase() + selectedLogo.slice(1)} Brand`}
      />
      
      <MockupPerformanceTest />
      
      <h2 className="text-2xl font-bold mt-8">Implementation Notes</h2>
      <div className="bg-muted p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Enhanced Mockup System</h3>
        <p className="mb-4">
          The enhanced mockup system provides realistic logo previews with the following features:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Realistic background images instead of solid colors</li>
          <li>Lighting effects with customizable direction and intensity</li>
          <li>Shadow effects with adjustable blur and opacity</li>
          <li>3D perspective transforms for angled surfaces</li>
          <li>Performance optimizations based on device capabilities</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-4">Next Steps</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Add actual background images to the public/assets/mockups/backgrounds directory</li>
          <li>Create preview thumbnails for each background image</li>
          <li>Add metadata (tags, descriptions) for better background search/filtering</li>
          <li>Optimize SVG rendering for complex logos</li>
          <li>Implement responsive image loading based on device capabilities</li>
          <li>Add WebP format support with fallbacks for better performance</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-4">Performance Considerations</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Complex lighting and shadow effects can be expensive, especially on mobile devices</li>
          <li>Background images should be properly sized and compressed</li>
          <li>Progressive loading should be implemented for slower connections</li>
          <li>SVG complexity should be reduced for better performance</li>
          <li>Effect intensity should be adjusted based on device capabilities</li>
        </ul>
      </div>
    </div>
  );
}