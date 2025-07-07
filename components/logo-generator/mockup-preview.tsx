'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MockupPreviewProps, SVGLogo } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { MockupService } from '@/lib/mockups/mockup-service';

export function MockupPreview({
  logo,
  template,
  customText = {},
  selectedColorVariant,
  brandName = 'Brand Name',
  className = '',
  onDownload,
}: MockupPreviewProps) {
  const [mockupSvg, setMockupSvg] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!logo) return;

    try {
      // Generate the mockup SVG
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      const generatedMockup = MockupService.generateMockup(
        svgCode,
        template.id,
        customText,
        selectedColorVariant,
        brandName
      );

      setMockupSvg(generatedMockup);

      // Convert to data URL
      const url = MockupService.generateMockupDataUrl(
        svgCode,
        template.id,
        customText,
        selectedColorVariant,
        brandName
      );

      setDataUrl(url);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating mockup:', error);
      setIsLoading(false);
    }
  }, [logo, template.id, customText, selectedColorVariant, brandName]);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      await MockupService.downloadMockup(
        svgCode,
        template.id,
        'png',
        undefined,
        1200,
        customText,
        selectedColorVariant,
        brandName
      );
    } catch (error) {
      console.error('Error downloading mockup:', error);
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 animate-pulse">
            <p className="text-sm text-muted-foreground">Loading mockup...</p>
          </div>
        ) : dataUrl ? (
          <>
            <div className="relative aspect-auto max-h-[500px] w-full overflow-hidden">
              <Image
                src={dataUrl}
                alt={`${brandName} on ${template.name}`}
                width={800}
                height={800 / template.aspectRatio}
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="absolute bottom-4 right-4">
              <Button
                size="sm"
                onClick={handleDownload}
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800">
            <p className="text-sm text-muted-foreground">Unable to generate mockup preview</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
