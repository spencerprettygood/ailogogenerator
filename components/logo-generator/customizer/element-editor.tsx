'use client'

import React, { useState, useEffect } from 'react';
import { ElementEditorProps, SVGElement } from '@/lib/types-customization';
import { updateElementColor, updateElementPosition, updateElementTypography } from '@/lib/utils/svg-parser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ColorPicker from './color-picker';
import PositioningControls from './positioning-controls';
import TypographyControls from './typography-controls';
import { Paintbrush, Move, Type, Settings } from 'lucide-react';

const ElementEditor: React.FC<ElementEditorProps> = ({
  element,
  onUpdate,
  colorPalette,
  fontOptions = [],
}) => {
  // Element type-specific properties
  const isText = element.type === 'text';
  const isShape = ['path', 'rect', 'circle', 'polygon', 'ellipse'].includes(element.type);
  
  // Get current colors
  const [fillColor, setFillColor] = useState<string>((element.attributes.fill as string) || '#000000');
  const [strokeColor, setStrokeColor] = useState<string>((element.attributes.stroke as string) || 'none');
  const [strokeWidth, setStrokeWidth] = useState<number>(
    Number(element.attributes['stroke-width']) || 1
  );

  // Update element when colors change
  useEffect(() => {
    const updatedElement = { ...element };
    updatedElement.attributes = { ...element.attributes };
    
    // Only update if changed to avoid unnecessary rerenders
    if (element.attributes.fill !== fillColor) {
      updatedElement.attributes.fill = fillColor;
    }
    
    if (element.attributes.stroke !== strokeColor) {
      updatedElement.attributes.stroke = strokeColor;
    }
    
    if (element.attributes['stroke-width'] !== strokeWidth) {
      updatedElement.attributes['stroke-width'] = strokeWidth;
    }
    
    onUpdate(updatedElement);
  }, [fillColor, strokeColor, strokeWidth]);

  // Handle fill color change
  const handleFillColorChange = (color: string) => {
    setFillColor(color);
  };

  // Handle stroke color change
  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
  };

  // Handle stroke width change
  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseFloat(e.target.value);
    if (!isNaN(width) && width >= 0) {
      setStrokeWidth(width);
    }
  };

  // Handle position updates
  const handlePositionUpdate = (updatedElement: SVGElement) => {
    onUpdate(updatedElement);
  };

  // Handle typography updates
  const handleTypographyUpdate = (updatedElement: SVGElement) => {
    onUpdate(updatedElement);
  };

  // Handle general attribute updates
  const handleAttributeChange = (attr: string, value: string | number) => {
    const updatedElement = { ...element };
    updatedElement.attributes = { ...element.attributes, [attr]: value };
    onUpdate(updatedElement);
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        Edit Element: {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
      </h3>

      <Tabs defaultValue="colors">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="colors" className="flex flex-col items-center text-xs py-2">
            <Paintbrush className="h-4 w-4 mb-1" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="position" className="flex flex-col items-center text-xs py-2">
            <Move className="h-4 w-4 mb-1" />
            Position
          </TabsTrigger>
          {isText && (
            <TabsTrigger value="typography" className="flex flex-col items-center text-xs py-2">
              <Type className="h-4 w-4 mb-1" />
              Text
            </TabsTrigger>
          )}
          <TabsTrigger value="advanced" className="flex flex-col items-center text-xs py-2">
            <Settings className="h-4 w-4 mb-1" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4 pt-4">
          {(isShape || isText || element.attributes.fill !== undefined) && (
            <div className="space-y-2">
              <Label htmlFor="fill-color">Fill Color</Label>
              <ColorPicker
                color={fillColor}
                onChange={handleFillColorChange}
                presetColors={colorPalette}
              />
            </div>
          )}

          {(isShape || element.attributes.stroke !== undefined) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="stroke-color">Stroke Color</Label>
                <ColorPicker
                  color={strokeColor}
                  onChange={handleStrokeColorChange}
                  presetColors={colorPalette}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stroke-width">Stroke Width</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="stroke-width"
                    type="number"
                    min="0"
                    step="0.5"
                    value={strokeWidth}
                    onChange={handleStrokeWidthChange}
                    className="w-20"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={strokeWidth}
                    onChange={handleStrokeWidthChange}
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Position Tab */}
        <TabsContent value="position" className="pt-4">
          <PositioningControls
            element={element}
            onUpdate={handlePositionUpdate}
          />
        </TabsContent>

        {/* Typography Tab - Only for text elements */}
        {isText && (
          <TabsContent value="typography" className="pt-4">
            <TypographyControls
              element={element}
              onUpdate={handleTypographyUpdate}
              fontOptions={fontOptions}
            />
          </TabsContent>
        )}

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="element-id">Element ID</Label>
            <Input
              id="element-id"
              value={element.id}
              onChange={(e) => handleAttributeChange('id', e.target.value)}
            />
          </div>
          
          {element.type === 'g' && (
            <div className="space-y-2">
              <Label htmlFor="transform">Transform</Label>
              <Input
                id="transform"
                value={element.attributes.transform as string || ''}
                onChange={(e) => handleAttributeChange('transform', e.target.value)}
              />
            </div>
          )}
          
          {isShape && element.type !== 'path' && (
            <div className="space-y-2">
              <Label htmlFor="opacity">Opacity</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="opacity"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={element.attributes.opacity as string || '1'}
                  onChange={(e) => handleAttributeChange('opacity', e.target.value)}
                  className="w-20"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={element.attributes.opacity as string || '1'}
                  onChange={(e) => handleAttributeChange('opacity', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElementEditor;