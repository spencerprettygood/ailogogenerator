'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SVGRenderer } from './svg-renderer';
import { cn } from '@/lib/utils';
import { FileDownloadInfo } from '@/lib/types';

export interface FaviconDisplayProps {
  /** SVG logo content as a string */
  svgContent: string;
  /** Brand or logo name */
  logoName?: string;
  /** Whether the favicon is being generated */
  isGenerating?: boolean;
  /** Whether the generation failed */
  hasError?: boolean;
  /** Optional error message */
  errorMessage?: string;
  /** Additional class name */
  className?: string;
  /** Callback when favicon downloads are requested */
  onDownloadRequest?: (type: 'ico' | 'png' | 'svg') => Promise<FileDownloadInfo | null>;
}

/**
 * Favicon Display Component
 *
 * Displays the logo as favicon previews in different sizes and offers
 * download options for various favicon formats.
 */
function FaviconDisplay({
  svgContent = '',
  logoName = 'logo',
  isGenerating = false,
  hasError = false,
  errorMessage = 'Failed to generate favicon',
  className,
  onDownloadRequest,
}: FaviconDisplayProps) {
  // States
  const [activeSizeTab, setActiveSizeTab] = useState<string>('32');
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({
    svg: false,
    ico: false,
    png: false,
  });

  // Function to render favicon at different sizes
  const renderFaviconPreview = (size: number) => {
    return (
      <div className="relative flex flex-col items-center space-y-2">
        <div
          className={cn(
            'overflow-hidden bg-white border border-border rounded flex items-center justify-center',
            size === 16
              ? 'w-[16px] h-[16px]'
              : size === 32
                ? 'w-[32px] h-[32px]'
                : 'w-[64px] h-[64px]'
          )}
        >
          <SVGRenderer svgContent={svgContent} className="w-full h-full" />
        </div>
        <Badge variant="outline" className="text-xs">
          {size}x{size}
        </Badge>
      </div>
    );
  };

  // Function to render browser tab preview
  const renderBrowserTabPreview = () => {
    return (
      <div className="w-full max-w-sm mx-auto mt-4 border border-border rounded-t-lg overflow-hidden bg-background shadow-sm">
        {/* Browser chrome */}
        <div className="bg-muted p-2 flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-destructive opacity-70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-70"></div>
          </div>
          <div className="flex-1 bg-background rounded-full h-6 flex items-center px-3">
            <div className="text-xs text-muted-foreground truncate">example.com</div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-muted/50 flex items-end border-b border-border h-8">
          <div className="flex items-center bg-background rounded-t-lg border-t border-l border-r border-border h-7 px-3 space-x-2 relative -mb-px">
            <div className="w-4 h-4 flex-shrink-0">
              <SVGRenderer svgContent={svgContent} className="w-full h-full" />
            </div>
            <div className="text-xs font-medium truncate max-w-[100px]">
              {logoName || 'Website'}
            </div>
          </div>
        </div>

        {/* Content area (minimal) */}
        <div className="h-28 flex items-center justify-center bg-background p-4">
          <div className="text-sm text-muted-foreground text-center">
            Browser tab preview with favicon
          </div>
        </div>
      </div>
    );
  };

  // Handle download request
  const handleDownload = async (type: 'ico' | 'png' | 'svg') => {
    if (!onDownloadRequest) {
      // Client-side fallback for SVG download
      if (type === 'svg') {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logoName}-favicon.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // For ICO and PNG, use HTML5 Canvas as fallback
      if (type === 'png') {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, 32, 32);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${logoName}-favicon.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };

          const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          img.src = url;
        } catch (error) {
          console.error('Failed to generate PNG:', error);
        }
        return;
      }

      // ICO generation requires server-side processing
      console.warn('ICO generation requires server-side processing');
      return;
    }

    try {
      setIsDownloading(prev => ({ ...prev, [type]: true }));

      const fileInfo = await onDownloadRequest(type);
      if (fileInfo && fileInfo.url) {
        const a = document.createElement('a');
        a.href = fileInfo.url;
        a.download = fileInfo.name || `${logoName}-favicon.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error(`Failed to download ${type} favicon:`, error);
    } finally {
      setIsDownloading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Render loading state
  if (isGenerating) {
    return (
      <Card className={cn('w-full max-w-md mx-auto overflow-hidden', className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
            <div className="flex items-center justify-center space-x-4">
              <div className="rounded-md bg-muted w-16 h-16"></div>
              <div className="rounded-md bg-muted w-8 h-8"></div>
              <div className="rounded-md bg-muted w-4 h-4"></div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary">Generating favicons...</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <Card className={cn('w-full max-w-md mx-auto overflow-hidden border-destructive', className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center space-y-4 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive w-16 h-16"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-destructive font-medium">{errorMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!svgContent) {
    return (
      <Card className={cn('w-full max-w-md mx-auto overflow-hidden', className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center space-y-4 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground w-16 h-16"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p className="text-muted-foreground">No logo provided for favicon</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium">Favicon Preview</h3>
            <p className="text-sm text-muted-foreground">
              Preview your logo as a favicon in different sizes
            </p>
          </div>

          {/* Size Tabs */}
          <Tabs defaultValue="32" value={activeSizeTab} onValueChange={setActiveSizeTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="16">16px</TabsTrigger>
              <TabsTrigger value="32">32px</TabsTrigger>
              <TabsTrigger value="64">64px</TabsTrigger>
            </TabsList>

            <TabsContent value="16" className="flex justify-center py-4">
              {renderFaviconPreview(16)}
            </TabsContent>

            <TabsContent value="32" className="flex justify-center py-4">
              {renderFaviconPreview(32)}
            </TabsContent>

            <TabsContent value="64" className="flex justify-center py-4">
              {renderFaviconPreview(64)}
            </TabsContent>
          </Tabs>

          {/* Browser Tab Preview */}
          {renderBrowserTabPreview()}
        </div>
      </CardContent>

      <CardFooter className="p-6 border-t flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">Download favicon formats:</div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('svg')}
            disabled={isDownloading.svg}
          >
            {isDownloading.svg ? (
              <LoadingSpinner className="h-4 w-4 mr-1" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-1" />
            )}
            SVG
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('png')}
            disabled={isDownloading.png}
          >
            {isDownloading.png ? (
              <LoadingSpinner className="h-4 w-4 mr-1" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-1" />
            )}
            PNG
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('ico')}
            disabled={isDownloading.ico}
          >
            {isDownloading.ico ? (
              <LoadingSpinner className="h-4 w-4 mr-1" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-1" />
            )}
            ICO
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Icon component for download
function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// Loading spinner component
function LoadingSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default FaviconDisplay;
