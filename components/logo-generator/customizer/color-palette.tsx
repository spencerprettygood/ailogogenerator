'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

interface ColorPaletteProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  className?: string;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, onChange, className = '' }) => {
  const [newColor, setNewColor] = useState<string>('#000000');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Add a new color to the palette
  const handleAddColor = () => {
    if (isValidColor(newColor) && !colors.includes(newColor)) {
      const updatedColors = [...colors, newColor];
      onChange(updatedColors);
      setNewColor('#000000');
    }
  };

  // Remove a color from the palette
  const handleRemoveColor = (index: number) => {
    const updatedColors = colors.filter((_, i) => i !== index);
    onChange(updatedColors);

    // If we were editing this color, cancel the edit
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  // Start editing a color
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(colors[index] || '');
  };

  // Save edited color
  const handleSaveEdit = () => {
    if (editingIndex !== null && isValidColor(editValue)) {
      const updatedColors = [...colors];
      updatedColors[editingIndex] = editValue;
      onChange(updatedColors);
      setEditingIndex(null);
    }
  };

  // Validate hex color
  const isValidColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Color Palette</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <div key={`${color}-${index}`} className="relative group">
              {editingIndex === index ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-24 h-8 text-xs"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-md cursor-pointer border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    onClick={() => handleStartEdit(index)}
                  />
                  <div className="absolute -bottom-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 bg-white dark:bg-gray-800 rounded-full shadow-sm"
                      onClick={() => handleStartEdit(index)}
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 bg-white dark:bg-gray-800 rounded-full shadow-sm text-red-500"
                      onClick={() => handleRemoveColor(index)}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-end gap-2">
            <div>
              <Input
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-8 h-8 p-1 cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddColor}
              title="Add color to palette"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click on a color to edit, or use the color picker to add new colors.
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorPalette;
