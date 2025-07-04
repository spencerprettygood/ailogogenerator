'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import ColorPicker from '@/components/logo-generator/customizer/color-picker';
import { 
  Download, 
  Info, 
  Check,
  Layers,
  FileIcon
} from 'lucide-react';
import { SVGLogo } from '@/lib/types';
import { 
  FAVICON_PACKAGES, 
  downloadFavicons 
} from '@/lib/mockups/favicon-generator';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';

interface FaviconCreatorProps {
  logo: string | SVGLogo;
  brandName: string;
  className?: string;
}

export function FaviconCreator({ 
  logo,
  brandName,
  className = ''
}: FaviconCreatorProps) {
  const [selectedPackageId, setSelectedPackageId] = useState('standard');
  const [themeColor, setThemeColor] = useState('#000000');
  
  // Handle package selection
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
  };
  
  // Handle color change
  const handleColorChange = (color: string) => {
    setThemeColor(color);
  };
  
  // Handle download
  const handleDownload = useCallback(async () => {
    try {
      await downloadFavicons(logo, selectedPackageId, brandName, themeColor);
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.UI,
        context: {
          component: 'FaviconCreator',
          operation: 'downloadFavicons'
        }
      });
    }
  }, [logo, selectedPackageId, brandName, themeColor]);
  
  // Format SVG for preview
  const getPreviewSvg = useCallback(() => {
    try {
      // Extract SVG content
      const svgString = typeof logo === 'string' ? logo : logo.svgCode;
      
      // Extract viewBox
      const viewBoxMatch = svgString.match(/viewBox=["']([^"']*)["']/);
      const viewBox = viewBoxMatch 
        ? viewBoxMatch[1] 
        : '0 0 100 100';
      
      // Create a square version for favicon preview
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100">
        ${svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)?.[1] || svgString}
      </svg>`;
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.UI,
        context: {
          component: 'FaviconCreator',
          operation: 'getPreviewSvg'
        }
      });
      return '';
    }
  }, [logo]);
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Left side - Configuration */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Favicon Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Package selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Package</Label>
              <div className="grid grid-cols-1 gap-3">
                {FAVICON_PACKAGES.map(pkg => (
                  <Button
                    key={pkg.id}
                    variant={selectedPackageId === pkg.id ? "default" : "outline"}
                    className="justify-between h-auto py-3 px-4"
                    onClick={() => handlePackageSelect(pkg.id)}
                  >
                    <div className="flex flex-col items-start text-left">
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{pkg.description}</div>
                    </div>
                    {selectedPackageId === pkg.id && (
                      <Check className="h-5 w-5 ml-2 flex-shrink-0" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Theme color */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme Color</Label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-md border"
                  style={{ backgroundColor: themeColor }}
                />
                <ColorPicker
                  color={themeColor}
                  onChange={handleColorChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This color will be used for browser theme colors and PWA manifests
              </p>
            </div>
            
            {/* Package details */}
            <div className="space-y-3 bg-muted p-4 rounded-md">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Package Details</Label>
              </div>
              
              {/* Show selected package details */}
              {FAVICON_PACKAGES.find(p => p.id === selectedPackageId) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Formats:</span>
                    <div className="flex space-x-1">
                      {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.formats.map(format => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sizes:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.sizes.map(size => (
                        <Badge key={size} variant="outline" className="text-xs">
                          {size}px
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Includes:</span>
                    <div className="flex space-x-1">
                      {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.includeManifest && (
                        <Badge variant="outline" className="text-xs">Manifest</Badge>
                      )}
                      {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.includeBrowserConfig && (
                        <Badge variant="outline" className="text-xs">Browser Config</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Preview and download */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Preview & Download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview tabs */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="package">Package Contents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                <div className="flex flex-col items-center space-y-4 p-6 bg-muted rounded-md">
                  {/* Favicon preview at different sizes */}
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-16 h-16 border bg-white rounded-md flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: getPreviewSvg() }}
                      />
                      <span className="text-xs mt-1">16x16</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-8 h-8 border bg-white rounded-md flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: getPreviewSvg() }}
                      />
                      <span className="text-xs mt-1">32x32</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-6 h-6 border bg-white rounded-md flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: getPreviewSvg() }}
                      />
                      <span className="text-xs mt-1">64x64</span>
                    </div>
                  </div>
                  
                  {/* Browser tab preview */}
                  <div className="w-full max-w-xs mt-4">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-t-md px-3 py-2 flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 border bg-white rounded-sm flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: getPreviewSvg() }}
                      />
                      <div className="text-xs truncate">{brandName}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border-x border-b rounded-b-md h-24 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Browser tab preview</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="package" className="mt-4">
                <div className="bg-muted p-4 rounded-md space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 p-2 rounded bg-background">
                      <FileIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs">favicon.svg</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded bg-background">
                      <FileIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs">favicon.ico</span>
                    </div>
                    
                    {/* PNG files */}
                    {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.sizes.slice(0, 4).map(size => (
                      <div key={size} className="flex items-center space-x-2 p-2 rounded bg-background">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">favicon-{size}x{size}.png</span>
                      </div>
                    ))}
                    
                    {/* More indicator if too many files */}
                    {(FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.sizes.length || 0) > 4 && (
                      <div className="flex items-center space-x-2 p-2 rounded bg-background">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">
                          +{(FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.sizes.length || 0) - 4} more PNG files
                        </span>
                      </div>
                    )}
                    
                    {/* Manifest and config files */}
                    {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.includeManifest && (
                      <div className="flex items-center space-x-2 p-2 rounded bg-background">
                        <FileIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs">manifest.json</span>
                      </div>
                    )}
                    
                    {FAVICON_PACKAGES.find(p => p.id === selectedPackageId)?.includeBrowserConfig && (
                      <div className="flex items-center space-x-2 p-2 rounded bg-background">
                        <FileIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs">browserconfig.xml</span>
                      </div>
                    )}
                    
                    {/* Always included files */}
                    <div className="flex items-center space-x-2 p-2 rounded bg-background">
                      <FileIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs">favicon-snippet.html</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded bg-background">
                      <FileIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs">README.txt</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Download button */}
            <Button 
              onClick={handleDownload}
              className="w-full mt-4"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Favicon Package
            </Button>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p>The package will be downloaded as a ZIP file containing all favicon files and installation instructions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}