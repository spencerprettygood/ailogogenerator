'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { PositioningControlsProps } from '@/lib/types-customization';
// Import not used
// import { updateElementPosition } from '@/lib/utils/svg-parser';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
  // These imports are not used
  // MoveHorizontal, MoveVertical, RotateCcw
} from 'lucide-react';

const PositioningControls: React.FC<PositioningControlsProps> = ({
  element,
  onUpdate,
}) => {
  // Initialize position values based on element type
  const [position, setPosition] = useState(() => {
    const { attributes } = element;
    
    // Different elements store position in different attributes
    switch (element.type) {
      case 'rect':
        return {
          x: parseFloat(attributes.x as string) || 0,
          y: parseFloat(attributes.y as string) || 0,
        };
      case 'circle':
      case 'ellipse':
        return {
          x: parseFloat(attributes.cx as string) || 0,
          y: parseFloat(attributes.cy as string) || 0,
        };
      case 'text':
        return {
          x: parseFloat(attributes.x as string) || 0,
          y: parseFloat(attributes.y as string) || 0,
        };
      case 'path':
        // For paths, use transform if available
        if (attributes.transform) {
          const match = /translate\(([^,]+),([^)]+)\)/.exec(attributes.transform as string);
          if (match) {
            return {
              x: parseFloat(match[1]) || 0,
              y: parseFloat(match[2]) || 0,
            };
          }
        }
        return { x: 0, y: 0 }; // Default for paths
      default:
        return { x: 0, y: 0 };
    }
  });

  // Initialize rotation
  const [rotation, setRotation] = useState(() => {
    const { attributes } = element;
    
    if (attributes.transform) {
      const rotateMatch = /rotate\(([^)]+)\)/.exec(attributes.transform as string);
      if (rotateMatch) {
        return parseFloat(rotateMatch[1]) || 0;
      }
    }
    
    return 0;
  });

  // Update element position - define with useCallback to fix dependency issues
  const updateElementWithPosition = useCallback(() => {
    const updatedElement = { ...element };
    const { attributes } = element;
    
    // Update position based on element type
    switch (element.type) {
      case 'rect':
        updatedElement.attributes = {
          ...attributes,
          x: position.x,
          y: position.y,
        };
        break;
      case 'circle':
      case 'ellipse':
        updatedElement.attributes = {
          ...attributes,
          cx: position.x,
          cy: position.y,
        };
        break;
      case 'text':
        updatedElement.attributes = {
          ...attributes,
          x: position.x,
          y: position.y,
        };
        break;
      case 'path':
      case 'polygon':
      default:
        // For other elements, use transform attribute
        let transform = '';
        
        // Add translation
        transform += `translate(${position.x},${position.y}) `;
        
        // Add rotation if present
        if (rotation !== 0) {
          // Rotate around element center
          transform += `rotate(${rotation})`;
        }
        
        updatedElement.attributes = {
          ...attributes,
          transform: transform.trim(),
        };
        break;
    }
    
    onUpdate(updatedElement);
  }, [element, position, rotation, onUpdate]);
  
  // Update position when form changes
  useEffect(() => {
    updateElementWithPosition();
  }, [updateElementWithPosition]);

  // Handle X position change
  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const x = parseFloat(e.target.value);
    if (!isNaN(x)) {
      setPosition({ ...position, x });
    }
  };

  // Handle Y position change
  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const y = parseFloat(e.target.value);
    if (!isNaN(y)) {
      setPosition({ ...position, y });
    }
  };

  // Handle rotation change
  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const angle = parseFloat(e.target.value);
    if (!isNaN(angle)) {
      setRotation(angle);
    }
  };

  // Move element by small increments
  const moveElement = (dx: number, dy: number) => {
    setPosition({
      x: position.x + dx,
      y: position.y + dy,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position-x">X Position</Label>
          <Input
            id="position-x"
            type="number"
            value={position.x}
            onChange={handleXChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="position-y">Y Position</Label>
          <Input
            id="position-y"
            type="number"
            value={position.y}
            onChange={handleYChange}
          />
        </div>
      </div>
      
      {/* Fine-tuning controls */}
      <div className="space-y-2">
        <Label>Fine Adjustments</Label>
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => moveElement(0, -1)}
            title="Move Up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <div></div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => moveElement(-1, 0)}
            title="Move Left"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => moveElement(0, 0)}
            title="Reset Position"
            disabled
          >
            <div className="h-4 w-4 rounded-full border-2 border-current"></div>
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => moveElement(1, 0)}
            title="Move Right"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <div></div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => moveElement(0, 1)}
            title="Move Down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <div></div>
        </div>
      </div>
      
      {/* Rotation controls */}
      {(element.type !== 'text' && element.type !== 'rect') && (
        <div className="space-y-2">
          <Label htmlFor="rotation">Rotation (degrees)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="rotation"
              type="number"
              value={rotation}
              onChange={handleRotationChange}
              className="w-20"
            />
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={handleRotationChange}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PositioningControls;