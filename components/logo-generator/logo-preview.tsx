'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { GeneratedAssets } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

interface LogoPreviewProps {
  assets: GeneratedAssets | null;
  brandName?: string;
  onDownloadRequest?: (format: 'svg' | 'png') => void;
  className?: string;
}

export function LogoPreview({ 
  assets, 
  brandName = "Generated Logo", 
  onDownloadRequest,
  className 
}: LogoPreviewProps) {
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let pngObjectUrl: string | null = null;

    if (assets?.primaryLogoSVG?.svgCode) {
      setSvgDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(assets.primaryLogoSVG.svgCode)}`);
    } else {
      setSvgDataUrl(null);
    }

    if (assets?.pngVersions?.size512) {
      // Check if it's a blob or a string
      const pngSource = typeof assets.pngVersions.size512 === 'string' 
        ? assets.pngVersions.size512
        : URL.createObjectURL(assets.pngVersions.size512 as any);
      setPngDataUrl(pngSource);
    } else {
      setPngDataUrl(null);
    }

    return () => {
      if (pngObjectUrl) {
        URL.revokeObjectURL(pngObjectUrl);
      }
    };
  }, [assets]);

  const displayUrl = svgDataUrl || pngDataUrl;
  const canDownloadSvg = !!assets?.primaryLogoSVG?.svgCode;
  const canDownloadPng = !!assets?.pngVersions?.size512;

  if (!assets) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Logo Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No assets to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{brandName} Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md mb-4 overflow-hidden">
          {displayUrl ? (
            <Image 
              src={displayUrl} 
              alt={`${brandName} Preview`} 
              width={192} // 48 * 4 (Tailwind h-48 is 12rem = 192px)
              height={192} // 48 * 4
              className="object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No preview available</p>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          Full branding package generated. Choose a format to download.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button 
            onClick={() => onDownloadRequest?.('svg')} 
            disabled={!canDownloadSvg || !onDownloadRequest}
            className="w-full sm:w-auto"
          >
            Download SVG
          </Button>
          <Button 
            onClick={() => onDownloadRequest?.('png')} 
            disabled={!canDownloadPng || !onDownloadRequest}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Download PNG (512px)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
