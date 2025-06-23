'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  AnimationType, 
  AnimationEasing, 
  AnimationTrigger, 
  AnimationOptions
} from '@/lib/animation/types';

interface AnimationCustomizerProps {
  initialOptions?: AnimationOptions;
  onSave: (options: AnimationOptions) => void;
  onPreview: (options: AnimationOptions) => void;
  className?: string;
}

export const AnimationCustomizer: React.FC<AnimationCustomizerProps> = ({
  initialOptions,
  onSave,
  onPreview,
  className = ''
}) => {
  // Default animation options
  const defaultOptions: AnimationOptions = {
    type: AnimationType.FADE_IN,
    timing: {
      duration: 1000,
      delay: 0,
      easing: AnimationEasing.EASE_IN_OUT
    },
    trigger: AnimationTrigger.LOAD
  };
  
  // State for animation options
  const [options, setOptions] = useState<AnimationOptions>(initialOptions || defaultOptions);
  
  // Update options when initialOptions change
  useEffect(() => {
    if (initialOptions) {
      setOptions(initialOptions);
    }
  }, [initialOptions]);
  
  // Handle changes to animation options
  const handleDurationChange = (value: number[]) => {
    setOptions(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        duration: value[0] || 1000
      }
    }));
  };
  
  const handleDelayChange = (value: number[]) => {
    setOptions(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        delay: value[0] || 0
      }
    }));
  };
  
  const handleEasingChange = (easing: AnimationEasing) => {
    setOptions(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        easing
      }
    }));
  };
  
  const handleTriggerChange = (trigger: AnimationTrigger) => {
    setOptions(prev => ({
      ...prev,
      trigger
    }));
  };
  
  const handleTypeChange = (type: AnimationType) => {
    setOptions(prev => ({
      ...prev,
      type
    }));
  };
  
  // Handle preview and save actions
  const handlePreview = () => {
    onPreview(options);
  };
  
  const handleSave = () => {
    onSave(options);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Customize Animation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Animation Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(AnimationType).slice(0, 6).map(type => (
              <Button 
                key={type}
                variant={options.type === type ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeChange(type)}
                className="text-xs"
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Duration: {options.timing.duration}ms
          </label>
          <Slider
            defaultValue={[options.timing.duration]}
            min={100}
            max={3000}
            step={100}
            onValueChange={handleDurationChange}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Delay: {options.timing.delay || 0}ms
          </label>
          <Slider
            defaultValue={[options.timing.delay || 0]}
            min={0}
            max={2000}
            step={100}
            onValueChange={handleDelayChange}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Easing Function</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(AnimationEasing).map(easing => (
              <Button 
                key={easing}
                variant={options.timing.easing === easing ? "default" : "outline"}
                size="sm"
                onClick={() => handleEasingChange(easing)}
                className="text-xs whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {easing.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Trigger</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.values(AnimationTrigger).map(trigger => (
              <Button 
                key={trigger}
                variant={options.trigger === trigger ? "default" : "outline"}
                size="sm"
                onClick={() => handleTriggerChange(trigger)}
                className="text-xs"
              >
                {trigger}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePreview}>
            Preview
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};