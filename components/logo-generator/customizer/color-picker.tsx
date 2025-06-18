'use client'

import React, { useState } from 'react';
import { ColorPickerProps } from '@/lib/types-customization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  presetColors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    'transparent', // Transparent/None
  ],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color === 'none' ? '' : color);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    setInputValue(newColor === 'none' ? '' : newColor);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    // Validate hex color format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      onChange(inputValue);
    } else if (inputValue === '') {
      onChange('none');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-10 h-10 p-1 border-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open color picker"
        >
          <div
            className="w-full h-full rounded"
            style={{
              backgroundColor: color === 'none' ? 'transparent' : color,
              backgroundImage: color === 'none' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 4px 4px',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
            }}
          />
        </Button>
        
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="#RRGGBB"
          className="flex-1"
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-64">
          <div className="grid grid-cols-4 gap-2 mb-2">
            {presetColors.map((presetColor) => (
              <Button
                key={presetColor}
                type="button"
                variant="outline"
                className="w-full h-8 p-1 relative"
                onClick={() => handleColorChange(presetColor)}
                aria-label={`Select color ${presetColor}`}
              >
                <div
                  className="w-full h-full rounded"
                  style={{
                    backgroundColor: presetColor === 'transparent' || presetColor === 'none' ? 'transparent' : presetColor,
                    backgroundImage: presetColor === 'transparent' || presetColor === 'none' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                  }}
                />
                {color === presetColor && (
                  <Check className={`absolute inset-0 m-auto h-4 w-4 ${presetColor === '#FFFFFF' || presetColor === 'transparent' || presetColor === 'none' ? 'text-black' : 'text-white'}`} />
                )}
              </Button>
            ))}
          </div>
          
          <div className="flex justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => handleColorChange(inputValue)}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" /> Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;