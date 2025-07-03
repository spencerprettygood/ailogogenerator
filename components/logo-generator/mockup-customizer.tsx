'use client';

import React, { useState } from 'react';
import { MockupTemplate, TextPlaceholder } from '@/lib/types-mockups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface MockupCustomizerProps {
  template: MockupTemplate;
  brandName: string;
  onUpdateCustomTextAction: (customText: Record<string, string>) => void;
  onUpdateColorVariantAction: (colorVariant: string) => void;
  selectedColorVariant?: string;
  initialCustomText?: Record<string, string>;
  className?: string;
}

export function MockupCustomizer({
  template,
  brandName,
  onUpdateCustomTextAction,
  onUpdateColorVariantAction,
  selectedColorVariant,
  initialCustomText = {},
  className = ''
}: MockupCustomizerProps) {
  const [customText, setCustomText] = useState<Record<string, string>>(initialCustomText);

  const handleTextChange = (id: string, value: string) => {
    const updatedText = { ...customText, [id]: value };
    setCustomText(updatedText);
    onUpdateCustomTextAction(updatedText);
  };

  const handleReset = () => {
    const defaultValues: Record<string, string> = {};
    
    template.textPlaceholders?.forEach((placeholder: TextPlaceholder) => {
      let defaultText = placeholder.default;
      // Replace {BRAND_NAME} placeholder with actual brand name
      defaultText = defaultText.replace('{BRAND_NAME}', brandName);
      defaultValues[placeholder.id] = defaultText;
    });
    
    setCustomText(defaultValues);
    onUpdateCustomTextAction(defaultValues);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Customize Mockup</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-8 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color variants */}
        {template.colorVariants && template.colorVariants.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {template.colorVariants.map((color) => (
                <div
                  key={color}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 ${
                    selectedColorVariant === color
                      ? 'border-primary'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateColorVariantAction(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text placeholders */}
        {template.textPlaceholders && template.textPlaceholders.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs font-medium">Text Elements</Label>
            {template.textPlaceholders.map((placeholder: TextPlaceholder) => {
              const defaultValue = placeholder.default.replace('{BRAND_NAME}', brandName);
              const value = customText[placeholder.id] || defaultValue;
              
              return (
                <div key={placeholder.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`text-${placeholder.id}`} className="text-xs">
                      {placeholder.name}
                    </Label>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      {placeholder.id}
                    </Badge>
                  </div>
                  {value.includes('\n') || value.length > 40 ? (
                    <Textarea
                      id={`text-${placeholder.id}`}
                      value={value}
                      onChange={(e) => handleTextChange(placeholder.id, e.target.value)}
                      className="h-20 text-xs"
                    />
                  ) : (
                    <Input
                      id={`text-${placeholder.id}`}
                      value={value}
                      onChange={(e) => handleTextChange(placeholder.id, e.target.value)}
                      className="h-8 text-xs"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}