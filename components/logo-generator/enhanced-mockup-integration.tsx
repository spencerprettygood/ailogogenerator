'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SVGLogo } from '@/lib/types';
import { EnhancedMockupPreviewSystem } from './enhanced-mockup-preview-system';
import { EnhancedEffectsConfig } from '@/lib/mockups/mockup-types';
import { EnhancedMockupService } from '@/lib/mockups/enhanced-mockup-service';

interface EnhancedMockupIntegrationProps {
  logo: SVGLogo | string;
  brandName?: string;
  className?: string;
}

export function EnhancedMockupIntegration({
  logo,
  brandName = 'Brand Name',
  className = '',
}: EnhancedMockupIntegrationProps) {
  const [initialEffectsConfig, setInitialEffectsConfig] = useState<EnhancedEffectsConfig>({
    applyLighting: true,
    lightDirection: 'top',
    lightIntensity: 0.3,
    applyPerspective: false,
    applyShadow: true,
    shadowBlur: 8,
    shadowOpacity: 0.3,
  });

  // Handle download
  const handleDownload = async (templateId: string, format: string) => {
    try {
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      await EnhancedMockupService.downloadEnhancedMockup(
        svgCode,
        templateId,
        format as 'png' | 'svg',
        undefined, // filename
        1200, // width
        undefined, // backgroundId
        {}, // customText
        initialEffectsConfig,
        brandName
      );
    } catch (error) {
      console.error('Error downloading mockup:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Realistic Mockups</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <EnhancedMockupPreviewSystem
          logo={logo}
          brandName={brandName}
          onDownload={handleDownload}
        />
      </CardContent>
    </Card>
  );
}

/**
 * A smaller version of the mockup integration for use in the logo generator app
 */
export function EnhancedMockupIntegrationCompact({
  logo,
  brandName = 'Brand Name',
  className = '',
}: EnhancedMockupIntegrationProps) {
  return (
    <div className={className}>
      <EnhancedMockupPreviewSystem
        logo={logo}
        brandName={brandName}
        onDownload={(templateId, format) => {
          try {
            const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
            EnhancedMockupService.downloadEnhancedMockup(
              svgCode,
              templateId,
              format as 'png' | 'svg',
              undefined,
              1200,
              undefined,
              {},
              {
                applyLighting: true,
                lightDirection: 'top',
                lightIntensity: 0.3,
                applyPerspective: false,
                applyShadow: true,
                shadowBlur: 8,
                shadowOpacity: 0.3,
              },
              brandName
            );
          } catch (error) {
            console.error('Error downloading mockup:', error);
          }
        }}
      />
    </div>
  );
}
