'use client';

import React, { useState, useEffect } from 'react';
import { SVGLogo } from '@/lib/types';
import { MockupType, MockupTemplate } from '@/lib/mockups/mockup-types';
import { MockupPreviewSystemProps } from '@/lib/types-mockups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MockupSelector } from './mockup-selector';
import { MockupPreview } from './mockup-preview';
import { MockupCustomizer } from './mockup-customizer';
import { MockupService } from '@/lib/mockups/mockup-service';
import { DEFAULT_MOCKUP_TEMPLATES } from '@/lib/mockups/template-data';

export function MockupPreviewSystem({
  logo,
  brandName = 'Brand Name',
  templates = DEFAULT_MOCKUP_TEMPLATES,
  className = '',
  onDownload,
  initialTemplateId,
}: MockupPreviewSystemProps) {
  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || (templates.length > 0 ? templates[0].id : '')
  );
  const [customText, setCustomText] = useState<Record<string, string>>({});
  const [selectedColorVariant, setSelectedColorVariant] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');

  // Find the selected template whenever the ID changes
  useEffect(() => {
    const template = templates.find(t => t.id === selectedTemplateId) || null;
    setSelectedTemplate(template);

    // Reset customization options when template changes
    if (template) {
      // Set default color variant
      if (template.colorVariants && template.colorVariants.length > 0) {
        setSelectedColorVariant(template.colorVariants[0]);
      } else {
        setSelectedColorVariant(undefined);
      }

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

  // Handle color variant selection
  const handleUpdateColorVariant = (colorVariant: string) => {
    setSelectedColorVariant(colorVariant);
  };

  // Handle download
  const handleDownload = () => {
    if (onDownload && selectedTemplateId) {
      onDownload(selectedTemplateId, 'png');
      return;
    }

    // Fallback to direct download if no callback provided
    if (selectedTemplate) {
      const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
      MockupService.downloadMockup(
        svgCode,
        selectedTemplate.id,
        'png',
        undefined,
        1200,
        customText,
        selectedColorVariant,
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
        <CardTitle>Logo Mockup Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="preview" className="w-full">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="templates">Browse Templates</TabsTrigger>
            </TabsList>
          </div>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-6">
            {selectedTemplate ? (
              <div className="space-y-6">
                <MockupPreview
                  logo={logo}
                  template={selectedTemplate}
                  customText={customText}
                  selectedColorVariant={selectedColorVariant}
                  brandName={brandName}
                  onDownload={handleDownload}
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
                <MockupPreview
                  logo={logo}
                  template={selectedTemplate}
                  customText={customText}
                  selectedColorVariant={selectedColorVariant}
                  brandName={brandName}
                  onDownload={handleDownload}
                />
                <MockupCustomizer
                  template={selectedTemplate}
                  brandName={brandName}
                  onUpdateCustomText={handleUpdateCustomText}
                  onUpdateColorVariant={handleUpdateColorVariant}
                  selectedColorVariant={selectedColorVariant}
                  initialCustomText={customText}
                />
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Select a template first to customize it.</p>
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
