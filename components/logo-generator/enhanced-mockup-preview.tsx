'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MockupPreviewProps, SVGLogo, EffectsConfig } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Settings } from 'lucide-react';
import { EnhancedMockupService } from '@/lib/mockups/enhanced-mockup-service';
import { 
  BackgroundImage,
  getBackgroundsByType,
  getBackgroundById
} from '@/lib/mockups/background-image-registry';

interface EnhancedMockupPreviewProps extends MockupPreviewProps {
  backgroundId?: string;
  onBackgroundChange?: (backgroundId: string) => void;
  showBackgroundSelector?: boolean;
  showEffectsControls?: boolean;
  effectsConfig?: EffectsConfig;
}

export function EnhancedMockupPreview({
  logo,
  template,
  customText = {},
  selectedColorVariant,
  brandName = 'Brand Name',
  className = '',
  onDownload,
  backgroundId,
  onBackgroundChange,
  showBackgroundSelector = true,
  showEffectsControls = false,
  effectsConfig: initialEffectsConfig
}: EnhancedMockupPreviewProps) {
  const [mockupSvg, setMockupSvg] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundImage[]>([]);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | undefined>(backgroundId);
  const [showBackgrounds, setShowBackgrounds] = useState<boolean>(false);
  
  // Effects configuration state
  const [effectsConfig, setEffectsConfig] = useState<EffectsConfig>(() => 
    initialEffectsConfig || EnhancedMockupService.getRecommendedEffects(template.id)
  );

  // Update effects when prop changes
  useEffect(() => {
    if (initialEffectsConfig) {
      setEffectsConfig(initialEffectsConfig);
    }
  }, [initialEffectsConfig]);

  // Load available backgrounds
  useEffect(() => {
    const backgrounds = getBackgroundsByType(template.type);
    setAvailableBackgrounds(backgrounds);
    
    // If no background is selected, choose the first one
    if (!selectedBackgroundId && backgrounds && backgrounds.length > 0) {
      const firstBg = backgrounds[0];
      if (firstBg) {
        setSelectedBackgroundId(firstBg.id);
        if (onBackgroundChange) {
          onBackgroundChange(firstBg.id);
        }
      }
    }
  }, [template.type, selectedBackgroundId, onBackgroundChange]);

  // Generate mockup when inputs change
  useEffect(() => {
    if (!logo) return;
    setIsLoading(true);

    try {
      // Extract SVG code
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      
      // Generate enhanced mockup
      const generatedMockup = EnhancedMockupService.generateEnhancedMockup(
        svgCode,
        template.id,
        selectedBackgroundId,
        customText,
        effectsConfig,
        brandName
      );
      
      setMockupSvg(generatedMockup);
      
      // Convert to data URL
      const url = EnhancedMockupService.generateEnhancedMockupDataUrl(
        svgCode,
        template.id,
        selectedBackgroundId,
        customText,
        effectsConfig,
        brandName
      );
      
      setDataUrl(url);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating enhanced mockup:', error);
      setIsLoading(false);
    }
  }, [logo, template.id, customText, selectedBackgroundId, effectsConfig, brandName]);

  // Handle background change
  const handleBackgroundChange = (id: string) => {
    setSelectedBackgroundId(id);
    if (onBackgroundChange) {
      onBackgroundChange(id);
    }
    setShowBackgrounds(false);
  };

  // Handle download
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      await EnhancedMockupService.downloadEnhancedMockup(
        svgCode,
        template.id,
        'png',
        undefined, // filename
        1200, // width
        selectedBackgroundId,
        customText,
        effectsConfig,
        brandName
      );
    } catch (error) {
      console.error('Error downloading enhanced mockup:', error);
    }
  };

  // Toggle lighting effect
  const toggleLighting = () => {
    setEffectsConfig((prev: EffectsConfig) => ({
      ...prev,
      applyLighting: !prev.applyLighting
    }));
  };

  // Toggle shadow effect
  const toggleShadow = () => {
    setEffectsConfig((prev: EffectsConfig) => ({
      ...prev,
      applyShadow: !prev.applyShadow
    }));
  };

  // Toggle perspective effect
  const togglePerspective = () => {
    setEffectsConfig((prev: EffectsConfig) => ({
      ...prev,
      applyPerspective: !prev.applyPerspective
    }));
  };

  // Change light direction
  const changeLightDirection = (direction: 'top' | 'right' | 'bottom' | 'left') => {
    setEffectsConfig((prev: EffectsConfig) => ({
      ...prev,
      lightDirection: direction
    }));
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 animate-pulse">
            <p className="text-sm text-muted-foreground">Loading enhanced mockup...</p>
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
            
            {/* Background selector */}
            {showBackgroundSelector && availableBackgrounds.length > 0 && (
              <div className="absolute top-4 left-4">
                <Button 
                  size="sm" 
                  onClick={() => setShowBackgrounds(!showBackgrounds)}
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Background
                </Button>
                
                {showBackgrounds && (
                  <div className="absolute top-10 left-0 z-10 bg-background/95 backdrop-blur-md p-3 rounded-md shadow-md border border-border mt-1 flex gap-2 flex-wrap max-w-[300px]">
                    {availableBackgrounds.map(bg => (
                      <div 
                        key={bg.id}
                        className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedBackgroundId === bg.id ? 'border-primary' : 'border-transparent hover:border-muted'
                        }`}
                        onClick={() => handleBackgroundChange(bg.id)}
                        title={bg.name}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={bg.preview || bg.url}
                            alt={bg.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Effects controls */}
            {showEffectsControls && (
              <div className="absolute top-4 right-4">
                <Button 
                  size="sm" 
                  onClick={() => setShowBackgrounds(!showBackgrounds)}
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Effects
                </Button>
                
                {showBackgrounds && (
                  <div className="absolute top-10 right-0 z-10 bg-background/95 backdrop-blur-md p-3 rounded-md shadow-md border border-border mt-1 w-[200px]">
                    <div className="space-y-3">
                      <div>
                        <Button 
                          size="sm" 
                          variant={effectsConfig.applyLighting ? "default" : "outline"} 
                          onClick={toggleLighting}
                          className="w-full"
                        >
                          {effectsConfig.applyLighting ? "Lighting: On" : "Lighting: Off"}
                        </Button>
                      </div>
                      
                      <div>
                        <Button 
                          size="sm" 
                          variant={effectsConfig.applyShadow ? "default" : "outline"} 
                          onClick={toggleShadow}
                          className="w-full"
                        >
                          {effectsConfig.applyShadow ? "Shadow: On" : "Shadow: Off"}
                        </Button>
                      </div>
                      
                      <div>
                        <Button 
                          size="sm" 
                          variant={effectsConfig.applyPerspective ? "default" : "outline"} 
                          onClick={togglePerspective}
                          className="w-full"
                        >
                          {effectsConfig.applyPerspective ? "Perspective: On" : "Perspective: Off"}
                        </Button>
                      </div>
                      
                      {effectsConfig.applyLighting && (
                        <div>
                          <p className="text-xs mb-1">Light Direction:</p>
                          <div className="grid grid-cols-2 gap-1">
                            <Button 
                              size="sm" 
                              variant={effectsConfig.lightDirection === 'top' ? "default" : "outline"} 
                              onClick={() => changeLightDirection('top')}
                            >
                              Top
                            </Button>
                            <Button 
                              size="sm" 
                              variant={effectsConfig.lightDirection === 'right' ? "default" : "outline"} 
                              onClick={() => changeLightDirection('right')}
                            >
                              Right
                            </Button>
                            <Button 
                              size="sm" 
                              variant={effectsConfig.lightDirection === 'bottom' ? "default" : "outline"} 
                              onClick={() => changeLightDirection('bottom')}
                            >
                              Bottom
                            </Button>
                            <Button 
                              size="sm" 
                              variant={effectsConfig.lightDirection === 'left' ? "default" : "outline"} 
                              onClick={() => changeLightDirection('left')}
                            >
                              Left
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Download button */}
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
            <p className="text-sm text-muted-foreground">
              Unable to generate enhanced mockup preview
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}