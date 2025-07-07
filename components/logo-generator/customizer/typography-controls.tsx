'use client';

import React, { useState, useEffect } from 'react';
import { TypographyControlsProps } from '@/lib/types-customization';
// Import not used
// import { updateElementTypography } from '@/lib/utils/svg-parser';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
// Import not used
// import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const TypographyControls: React.FC<TypographyControlsProps> = ({
  element,
  onUpdate,
  fontOptions,
}) => {
  // Declare all hooks before any conditionals - this is crucial for React Hook rules
  const [text, setText] = useState(element.type === 'text' ? element.content || '' : '');
  const [fontFamily, setFontFamily] = useState(
    element.type === 'text' ? (element.attributes['font-family'] as string) || 'Arial' : 'Arial'
  );
  const [fontSize, setFontSize] = useState(
    element.type === 'text' ? parseFloat((element.attributes['font-size'] as string) || '12') : 12
  );
  const [fontWeight, setFontWeight] = useState(
    element.type === 'text' ? (element.attributes['font-weight'] as string) || 'normal' : 'normal'
  );
  const [fontStyle, setFontStyle] = useState(
    element.type === 'text' ? (element.attributes['font-style'] as string) || 'normal' : 'normal'
  );
  const [textAnchor, setTextAnchor] = useState(
    element.type === 'text' ? (element.attributes['text-anchor'] as string) || 'start' : 'start'
  );

  // Update element when typography changes - place this before any conditionals
  useEffect(() => {
    // Only update if this is a text element
    if (element.type !== 'text') return;

    const updatedElement = { ...element };
    updatedElement.attributes = { ...element.attributes };
    updatedElement.content = text;

    // Update font attributes
    updatedElement.attributes['font-family'] = fontFamily;
    updatedElement.attributes['font-size'] = fontSize;
    updatedElement.attributes['font-weight'] = fontWeight;
    updatedElement.attributes['font-style'] = fontStyle;
    updatedElement.attributes['text-anchor'] = textAnchor;

    onUpdate(updatedElement);
  }, [text, fontFamily, fontSize, fontWeight, fontStyle, textAnchor, element, onUpdate]);

  // Only proceed if this is a text element
  if (element.type !== 'text') {
    return <div>Typography controls are only available for text elements.</div>;
  }

  // Handle text content change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  // Handle font family change
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
  };

  // Handle font size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseFloat(e.target.value);
    if (!isNaN(size) && size > 0) {
      setFontSize(size);
    }
  };

  // Toggle font weight
  const toggleFontWeight = () => {
    setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold');
  };

  // Toggle font style
  const toggleFontStyle = () => {
    setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic');
  };

  // Set text alignment
  const setAlignment = (alignment: 'start' | 'middle' | 'end') => {
    setTextAnchor(alignment);
  };

  return (
    <div className="space-y-4">
      {/* Text content */}
      <div className="space-y-2">
        <Label htmlFor="text-content">Text Content</Label>
        <Input id="text-content" value={text} onChange={handleTextChange} />
      </div>

      {/* Font family */}
      <div className="space-y-2">
        <Label htmlFor="font-family">Font Family</Label>
        <select
          id="font-family"
          value={fontFamily}
          onChange={handleFontFamilyChange}
          className="w-full px-3 py-2 border rounded-md"
        >
          {fontOptions.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div className="space-y-2">
        <Label htmlFor="font-size">Font Size</Label>
        <div className="flex items-center gap-3">
          <Input
            id="font-size"
            type="number"
            min="1"
            value={fontSize}
            onChange={handleFontSizeChange}
            className="w-20"
          />
          <input
            type="range"
            min="4"
            max="72"
            value={fontSize}
            onChange={handleFontSizeChange}
            className="flex-1"
          />
        </div>
      </div>

      {/* Font styling */}
      <div className="space-y-2">
        <Label>Text Style</Label>
        <div className="flex items-center gap-2">
          <Button
            variant={fontWeight === 'bold' ? 'default' : 'outline'}
            size="icon"
            onClick={toggleFontWeight}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant={fontStyle === 'italic' ? 'default' : 'outline'}
            size="icon"
            onClick={toggleFontStyle}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <Button
            variant={textAnchor === 'start' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setAlignment('start')}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={textAnchor === 'middle' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setAlignment('middle')}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            variant={textAnchor === 'end' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setAlignment('end')}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div
          className="p-3 border rounded-md bg-white dark:bg-gray-800 min-h-[40px] flex items-center"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight,
            fontStyle,
            textAlign:
              textAnchor === 'start' ? 'left' : textAnchor === 'middle' ? 'center' : 'right',
          }}
        >
          {text || 'Text Preview'}
        </div>
      </div>
    </div>
  );
};

export default TypographyControls;
