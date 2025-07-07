'use client';

import React, { useState, useEffect } from 'react';
import { SVGLogo } from '@/lib/types';
import { MockupType, MockupTemplate } from '@/lib/mockups/mockup-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MockupSelector } from './mockup-selector';
import { EnhancedMockupPreview } from './enhanced-mockup-preview';
import { MockupCustomizer } from './mockup-customizer';
import { EnhancedBackgroundSelector } from './enhanced-background-selector';
import { EnhancedMockupService } from '@/lib/mockups/enhanced-mockup-service';
import { DEFAULT_MOCKUP_TEMPLATES } from '@/lib/mockups/template-data';

interface EnhancedMockupPreviewSystemProps {
  logo: string | SVGLogo;
  brandName?: string;
  templates?: MockupTemplate[];
  className?: string;
  onDownload?: (templateId: string, format: string) => void;
  initialTemplateId?: string;
}

export function EnhancedMockupPreviewSystem({
  logo,
  brandName = 'Brand Name',
  templates = DEFAULT_MOCKUP_TEMPLATES,
  className = '',
  onDownload,
  initialTemplateId,
}: EnhancedMockupPreviewSystemProps) {
  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || (templates?.[0]?.id ?? '')
  );
  const [customText, setCustomText] = useState<Record<string, string>>({});
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [useEnhancedEffects, setUseEnhancedEffects] = useState<boolean>(true);
  const [effectsConfig, setEffectsConfig] = useState<{
    applyLighting: boolean;
    lightDirection: 'top' | 'right' | 'bottom' | 'left';
    lightIntensity: number;
    applyPerspective: boolean;
    perspectiveTransform?: {
      rotateX: number;
      rotateY: number;
      rotateZ: number;
      translateZ: number;
    };
    applyShadow: boolean;
    shadowBlur: number;
    shadowOpacity: number;
  }>({
    applyLighting: true,
    lightDirection: 'top',
    lightIntensity: 0.3,
    applyPerspective: false,
    applyShadow: true,
    shadowBlur: 8,
    shadowOpacity: 0.3,
  });

  // Find the selected template whenever the ID changes
  useEffect(() => {
    const template = templates.find(t => t.id === selectedTemplateId) || null;
    setSelectedTemplate(template);

    // Reset customization options when template changes
    if (template) {
      // Set default text values
      if (template.textPlaceholders) {
        const defaultValues: Record<string, string> = {};
        template.textPlaceholders.forEach(placeholder => {
          defaultValues[placeholder.id] = placeholder.default.replace('{BRAND_NAME}', brandName);
        });
        setCustomText(defaultValues);
      } else {
        setCustomText({});
      }

      // Set recommended effects for this template type
      setEffectsConfig(EnhancedMockupService.getRecommendedEffects(template.id));
    }
  }, [selectedTemplateId, templates, brandName]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Handle custom text updates
  const handleUpdateCustomText = (newCustomText: Record<string, string>) => {
    setCustomText(newCustomText);
  };

  // Handle background selection
  const handleSelectBackground = (backgroundId: string) => {
    setSelectedBackgroundId(backgroundId);
  };

  // Handle download
  const handleDownload = () => {
    if (onDownload && selectedTemplateId) {
      onDownload(selectedTemplateId, 'png');
      return;
    }

    // Fallback to direct download if no callback provided
    if (selectedTemplate && logo) {
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      EnhancedMockupService.downloadEnhancedMockup(
        svgCode,
        selectedTemplate.id,
        'png',
        undefined,
        1200,
        selectedBackgroundId,
        customText,
        useEnhancedEffects
          ? effectsConfig
          : {
              applyLighting: false,
              lightDirection: 'top',
              lightIntensity: 0,
              applyPerspective: false,
              applyShadow: false,
            },
        brandName
      );
    }
  };

  // Group templates by type for tab organization
  const templatesByType = templates.reduce(
    (acc, template) => {
      if (!acc[template.type]) {
        acc[template.type] = [];
      }
      acc[template.type].push(template);
      return acc;
    },
    {} as Record<MockupType, MockupTemplate[]>
  );

  // Create tabs for each mockup type that has templates
  const mockupTypeTabs = Object.entries(templatesByType)
    .filter(([_, typeTemplates]) => typeTemplates.length > 0)
    .map(([type, _]) => ({
      value: type,
      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Enhanced Logo Mockup Preview</span>
          <div className="flex items-center space-x-2">
            <Switch
              id="enhanced-effects"
              checked={useEnhancedEffects}
              onCheckedChange={setUseEnhancedEffects}
            />
            <Label htmlFor="enhanced-effects" className="text-sm font-normal">
              Enhanced Effects
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="preview" className="w-full">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="templates">Browse Templates</TabsTrigger>
            </TabsList>
          </div>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-6">
            {selectedTemplate ? (
              <div className="space-y-6">
                <EnhancedMockupPreview
                  logo={logo}
                  template={selectedTemplate}
                  customText={customText}
                  selectedColorVariant={undefined}
                  brandName={brandName}
                  backgroundId={selectedBackgroundId}
                  onDownload={handleDownload}
                  showBackgroundSelector={false}
                  showEffectsControls={true}
                />
                <p className="text-sm text-muted-foreground text-center">
                  {selectedTemplate.description}
                </p>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  Select a template to preview your logo in context.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize" className="p-6">
            {selectedTemplate ? (
              <div className="grid md:grid-cols-2 gap-6">
                <EnhancedMockupPreview
                  logo={logo}
                  template={selectedTemplate}
                  customText={customText}
                  selectedColorVariant={undefined}
                  brandName={brandName}
                  backgroundId={selectedBackgroundId}
                  onDownload={handleDownload}
                  showBackgroundSelector={false}
                  showEffectsControls={false}
                />
                <MockupCustomizer
                  template={selectedTemplate}
                  brandName={brandName}
                  onUpdateCustomTextAction={handleUpdateCustomText}
                  onUpdateColorVariantAction={() => {}}
                  selectedColorVariant={undefined}
                  initialCustomText={customText}
                />
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Select a template first to customize it.</p>
              </div>
            )}
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="p-6">
            {selectedTemplate ? (
              <div className="space-y-6">
                <EnhancedMockupPreview
                  logo={logo}
                  template={selectedTemplate}
                  customText={customText}
                  selectedColorVariant={undefined}
                  brandName={brandName}
                  backgroundId={selectedBackgroundId}
                  onDownload={handleDownload}
                  showBackgroundSelector={false}
                  showEffectsControls={false}
                />
                <EnhancedBackgroundSelector
                  initialBackgroundId={selectedBackgroundId}
                  mockupType={selectedTemplate.type}
                  onSelectBackground={handleSelectBackground}
                />
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  Select a template first to choose a background.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="p-6">
            <Tabs defaultValue={Object.keys(templatesByType)[0] || 'business_card'}>
              <TabsList className="mb-6">
                {mockupTypeTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(templatesByType).map(([type, typeTemplates]) => (
                <TabsContent key={type} value={type}>
                  <MockupSelector
                    templates={typeTemplates}
                    selectedTemplateId={selectedTemplateId}
                    onSelectTemplate={handleSelectTemplate}
                    onSelectTemplateAction={handleSelectTemplate}
                    logo={logo}
                    brandName={brandName}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
