import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AnimationType, 
  AnimationEasing, 
  AnimationTrigger, 
  AnimationOptions
} from '@/lib/animation/types';
import { animationTemplates } from '@/lib/animation/animation-service';

interface AnimationSelectorProps {
  onSelectAnimation: (animationOptions: AnimationOptions) => void;
  className?: string;
}

export const AnimationSelector: React.FC<AnimationSelectorProps> = ({ 
  onSelectAnimation,
  className = '' 
}) => {
  const [selectedType, setSelectedType] = useState<AnimationType>(AnimationType.FADE_IN);
  const [selectedTrigger, setSelectedTrigger] = useState<AnimationTrigger>(AnimationTrigger.LOAD);
  const [duration, setDuration] = useState<number>(1000);
  
  const handleSelect = (template: any) => {
    setSelectedType(template.defaultOptions.type);
    setSelectedTrigger(template.defaultOptions.trigger || AnimationTrigger.LOAD);
    setDuration(template.defaultOptions.timing.duration);
    
    onSelectAnimation(template.defaultOptions);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-sm font-medium mb-2">Choose an animation style:</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {animationTemplates.slice(0, 6).map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === template.defaultOptions.type ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => handleSelect(template)}
          >
            <CardContent className="p-3">
              <div className="text-xs font-medium mb-1">{template.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{template.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Selected: {selectedType} animation on {selectedTrigger} with {duration}ms duration
      </div>
    </div>
  );
};