'use client'

import React, { useState } from 'react';
import { ShapeLibraryProps, ShapeTemplate } from '@/lib/types-customization';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import ColorPicker from './color-picker';
import { Circle, Square, Triangle, Star, PlusCircle, Minus, CircleDashed, Squircle, Hash, Waves, Sparkles } from 'lucide-react';

// Basic shape templates
const BASIC_SHAPES: ShapeTemplate[] = [
  {
    name: 'Circle',
    type: 'circle',
    icon: Circle,
    attributes: {
      cx: 50,
      cy: 50,
      r: 30,
      fill: '#000000',
      stroke: 'none',
      'stroke-width': 0
    }
  },
  {
    name: 'Square',
    type: 'rect',
    icon: Square,
    attributes: {
      x: 20,
      y: 20,
      width: 60,
      height: 60,
      fill: '#000000',
      stroke: 'none',
      'stroke-width': 0
    }
  },
  {
    name: 'Rectangle',
    type: 'rect',
    icon: Square,
    attributes: {
      x: 20,
      y: 30,
      width: 60,
      height: 40,
      fill: '#000000',
      stroke: 'none',
      'stroke-width': 0
    }
  },
  {
    name: 'Triangle',
    type: 'polygon',
    icon: Triangle,
    attributes: {
      points: '50,20 80,80 20,80',
      fill: '#000000',
      stroke: 'none',
      'stroke-width': 0
    }
  },
  {
    name: 'Ellipse',
    type: 'ellipse',
    icon: CircleDashed,
    attributes: {
      cx: 50,
      cy: 50,
      rx: 40,
      ry: 25,
      fill: '#000000',
      stroke: 'none',
      'stroke-width': 0
    }
  },
  {
    name: 'Star',
    type: 'polygon',
    icon: Star,
    attributes: {
      points: '50,15 61,40 90,40 66,56 74,80 50,67 26,80 34,56 10,40 39,40',
      fill: '#000000',
      stroke: 'none',
      'stroke-width': 0
    }
  }
];

// Decorative elements
const DECORATIVE_ELEMENTS: ShapeTemplate[] = [
  {
    name: 'Line',
    type: 'line',
    icon: Minus,
    attributes: {
      x1: 20,
      y1: 50,
      x2: 80,
      y2: 50,
      stroke: '#000000',
      'stroke-width': 3,
      fill: 'none'
    }
  },
  {
    name: 'Dotted Circle',
    type: 'circle',
    icon: CircleDashed,
    attributes: {
      cx: 50,
      cy: 50,
      r: 30,
      fill: 'none',
      stroke: '#000000',
      'stroke-width': 2,
      'stroke-dasharray': '4 4'
    }
  },
  {
    name: 'Dots',
    type: 'g',
    icon: Hash,
    attributes: {
      fill: '#000000'
    },
    children: [
      {
        type: 'circle',
        attributes: {
          cx: 30,
          cy: 50,
          r: 5,
          fill: '#000000'
        }
      },
      {
        type: 'circle',
        attributes: {
          cx: 50,
          cy: 50,
          r: 5,
          fill: '#000000'
        }
      },
      {
        type: 'circle',
        attributes: {
          cx: 70,
          cy: 50,
          r: 5,
          fill: '#000000'
        }
      }
    ]
  },
  {
    name: 'Wave',
    type: 'path',
    icon: Waves,
    attributes: {
      d: 'M10,50 C20,30 30,70 40,50 C50,30 60,70 70,50 C80,30 90,70 100,50',
      fill: 'none',
      stroke: '#000000',
      'stroke-width': 2
    }
  },
  {
    name: 'Sparkles',
    type: 'g',
    icon: Sparkles,
    attributes: {
      fill: '#000000'
    },
    children: [
      {
        type: 'polygon',
        attributes: {
          points: '30,40 33,47 40,50 33,53 30,60 27,53 20,50 27,47',
          fill: '#000000'
        }
      },
      {
        type: 'polygon',
        attributes: {
          points: '60,25 63,32 70,35 63,38 60,45 57,38 50,35 57,32',
          fill: '#000000'
        }
      },
      {
        type: 'polygon',
        attributes: {
          points: '70,60 73,67 80,70 73,73 70,80 67,73 60,70 67,67',
          fill: '#000000'
        }
      }
    ]
  },
  {
    name: 'Arc',
    type: 'path',
    icon: CircleDashed,
    attributes: {
      d: 'M20,70 A40,40 0 0,1 80,70',
      fill: 'none',
      stroke: '#000000',
      'stroke-width': 2
    }
  }
];

const ShapeLibrary: React.FC<ShapeLibraryProps> = ({
  onAddShape,
  colorPalette,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ShapeTemplate | null>(null);
  const [customizedAttributes, setCustomizedAttributes] = useState<Record<string, any>>({});
  
  // Handle shape selection
  const handleShapeSelect = (template: ShapeTemplate) => {
    setSelectedTemplate(template);
    // Initialize customization with template attributes
    setCustomizedAttributes({ ...template.attributes });
  };
  
  // Handle attribute changes
  const handleAttributeChange = (attr: string, value: string | number) => {
    setCustomizedAttributes(prev => ({
      ...prev,
      [attr]: value
    }));
  };
  
  // Generate a unique ID for the new shape
  const generateUniqueId = () => {
    return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };
  
  // Add the shape to the logo
  const handleAddShape = () => {
    if (!selectedTemplate) return;
    
    const newElement = {
      id: generateUniqueId(),
      type: selectedTemplate.type,
      attributes: { ...customizedAttributes },
    };
    
    // Handle group elements with children
    if (selectedTemplate.children) {
      // Clone the children and assign new IDs
      const childrenWithIds = selectedTemplate.children.map(child => ({
        ...child,
        id: generateUniqueId(),
        // Preserve the connection to the parent
        attributes: {
          ...child.attributes,
          parent: newElement.id
        }
      }));
      
      // Add the children elements first
      childrenWithIds.forEach(child => {
        onAddShape(child);
      });
    }
    
    // Add the main element
    onAddShape(newElement);
    
    // Reset selection
    setSelectedTemplate(null);
  };
  
  // Render a shape template
  const renderShapeTemplate = (template: ShapeTemplate) => {
    return (
      <div 
        key={template.name}
        className={`p-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
          selectedTemplate?.name === template.name ? 'ring-2 ring-primary bg-gray-100 dark:bg-gray-700' : ''
        }`}
        onClick={() => handleShapeSelect(template)}
      >
        <div className="w-full aspect-square flex items-center justify-center mb-2">
          <template.icon className="w-8 h-8" />
        </div>
        <p className="text-xs text-center">{template.name}</p>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="basic">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="basic">Basic Shapes</TabsTrigger>
          <TabsTrigger value="decorative">Decorative</TabsTrigger>
        </TabsList>
        
        {/* Basic Shapes Tab */}
        <TabsContent value="basic" className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            {BASIC_SHAPES.map(renderShapeTemplate)}
          </div>
        </TabsContent>
        
        {/* Decorative Elements Tab */}
        <TabsContent value="decorative" className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            {DECORATIVE_ELEMENTS.map(renderShapeTemplate)}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Shape Customization Panel */}
      {selectedTemplate && (
        <Card className="mt-4">
          <CardContent className="pt-4 space-y-3">
            <h3 className="text-sm font-medium">{selectedTemplate.name} Settings</h3>
            
            {/* Color settings */}
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker
                color={customizedAttributes.fill || '#000000'}
                onChange={(color) => handleAttributeChange('fill', color)}
                presetColors={colorPalette}
              />
            </div>
            
            {/* Stroke settings (if applicable) */}
            {(selectedTemplate.type !== 'g') && (
              <div className="space-y-2">
                <Label>Stroke Color</Label>
                <ColorPicker
                  color={customizedAttributes.stroke || 'none'}
                  onChange={(color) => handleAttributeChange('stroke', color)}
                  presetColors={[...colorPalette, 'none']}
                />
              </div>
            )}
            
            {/* Stroke width (if applicable) */}
            {customizedAttributes.stroke && customizedAttributes.stroke !== 'none' && (
              <div className="space-y-2">
                <Label>Stroke Width</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customizedAttributes['stroke-width'] || 0}
                    onChange={(e) => handleAttributeChange('stroke-width', parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <Slider
                    value={[parseFloat(customizedAttributes['stroke-width'] as string || '0')]}
                    min={0}
                    max={10}
                    step={0.5}
                    onValueChange={(value) => handleAttributeChange('stroke-width', value[0])}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
            
            {/* Size controls - different for different shape types */}
            {selectedTemplate.type === 'circle' && (
              <div className="space-y-2">
                <Label>Radius</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    value={customizedAttributes.r || 30}
                    onChange={(e) => handleAttributeChange('r', parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <Slider
                    value={[parseFloat(customizedAttributes.r as string || '30')]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleAttributeChange('r', value[0])}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
            
            {selectedTemplate.type === 'rect' && (
              <>
                <div className="space-y-2">
                  <Label>Width</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={customizedAttributes.width || 60}
                      onChange={(e) => handleAttributeChange('width', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <Slider
                      value={[parseFloat(customizedAttributes.width as string || '60')]}
                      min={5}
                      max={100}
                      step={1}
                      onValueChange={(value) => handleAttributeChange('width', value[0])}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={customizedAttributes.height || 60}
                      onChange={(e) => handleAttributeChange('height', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <Slider
                      value={[parseFloat(customizedAttributes.height as string || '60')]}
                      min={5}
                      max={100}
                      step={1}
                      onValueChange={(value) => handleAttributeChange('height', value[0])}
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            )}
            
            {selectedTemplate.type === 'ellipse' && (
              <>
                <div className="space-y-2">
                  <Label>X Radius</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={customizedAttributes.rx || 40}
                      onChange={(e) => handleAttributeChange('rx', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <Slider
                      value={[parseFloat(customizedAttributes.rx as string || '40')]}
                      min={5}
                      max={50}
                      step={1}
                      onValueChange={(value) => handleAttributeChange('rx', value[0])}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Y Radius</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={customizedAttributes.ry || 25}
                      onChange={(e) => handleAttributeChange('ry', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <Slider
                      value={[parseFloat(customizedAttributes.ry as string || '25')]}
                      min={5}
                      max={50}
                      step={1}
                      onValueChange={(value) => handleAttributeChange('ry', value[0])}
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            )}
            
            {selectedTemplate.type === 'line' && (
              <>
                <div className="space-y-2">
                  <Label>Length</Label>
                  <Slider
                    value={[parseFloat(customizedAttributes.x2 as string || '80') - parseFloat(customizedAttributes.x1 as string || '20')]}
                    min={10}
                    max={80}
                    step={1}
                    onValueChange={(value) => {
                      const center = (parseFloat(customizedAttributes.x1 as string || '20') + parseFloat(customizedAttributes.x2 as string || '80')) / 2;
                      const halfLength = value[0] / 2;
                      handleAttributeChange('x1', center - halfLength);
                      handleAttributeChange('x2', center + halfLength);
                    }}
                    className="w-full"
                  />
                </div>
              </>
            )}
            
            {/* Position for all shapes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>X Position</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    selectedTemplate.type === 'circle' || selectedTemplate.type === 'ellipse' 
                      ? customizedAttributes.cx || 50
                      : selectedTemplate.type === 'rect'
                      ? customizedAttributes.x || 20
                      : 50
                  }
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (selectedTemplate.type === 'circle' || selectedTemplate.type === 'ellipse') {
                      handleAttributeChange('cx', value);
                    } else if (selectedTemplate.type === 'rect') {
                      handleAttributeChange('x', value);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Y Position</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    selectedTemplate.type === 'circle' || selectedTemplate.type === 'ellipse'
                      ? customizedAttributes.cy || 50
                      : selectedTemplate.type === 'rect'
                      ? customizedAttributes.y || 20
                      : 50
                  }
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (selectedTemplate.type === 'circle' || selectedTemplate.type === 'ellipse') {
                      handleAttributeChange('cy', value);
                    } else if (selectedTemplate.type === 'rect') {
                      handleAttributeChange('y', value);
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Add button */}
            <Button 
              className="w-full mt-2"
              onClick={handleAddShape}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add to Logo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShapeLibrary;