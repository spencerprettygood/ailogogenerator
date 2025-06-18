import React, { useState, useEffect } from 'react';
import { AnimationType, AnimationEasing, AnimationTrigger, AnimationOptions } from '../../lib/animation/types';
import { animationTemplates } from '../../lib/animation/animation-service';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface AnimationSelectorProps {
  onSelectAnimation: (animationOptions: AnimationOptions | null) => void;
  selectedAnimationType?: AnimationType | null;
  initialOptions?: AnimationOptions | null;
  className?: string;
}

export function AnimationSelector({
  onSelectAnimation,
  selectedAnimationType = null,
  initialOptions = null,
  className = ''
}: AnimationSelectorProps) {
  const [selectedType, setSelectedType] = useState<AnimationType | null>(
    selectedAnimationType || initialOptions?.type || null
  );
  const [customOptions, setCustomOptions] = useState<Partial<AnimationOptions>>(
    initialOptions || {
      timing: {
        duration: 1000,
        easing: AnimationEasing.EASE_IN_OUT
      }
    }
  );
  const [showCustomOptions, setShowCustomOptions] = useState(false);

  useEffect(() => {
    // When a template is selected, update the animation options
    if (selectedType && selectedType !== AnimationType.CUSTOM) {
      const template = animationTemplates.find(t => t.defaultOptions.type === selectedType);
      if (template) {
        onSelectAnimation(template.defaultOptions);
      }
    } else if (selectedType === AnimationType.CUSTOM) {
      setShowCustomOptions(true);
      onSelectAnimation({
        type: AnimationType.CUSTOM,
        timing: {
          duration: customOptions.timing?.duration || 1000,
          easing: customOptions.timing?.easing || AnimationEasing.EASE_IN_OUT
        },
        customKeyframes: customOptions.customKeyframes || ''
      });
    } else {
      onSelectAnimation(null);
    }
  }, [selectedType]);

  const handleCustomOptionsChange = (newOptions: Partial<AnimationOptions>) => {
    const updatedOptions = {
      ...customOptions,
      ...newOptions,
      timing: {
        ...customOptions.timing,
        ...newOptions.timing
      }
    };
    
    setCustomOptions(updatedOptions);
    
    onSelectAnimation({
      type: AnimationType.CUSTOM,
      timing: {
        duration: updatedOptions.timing?.duration || 1000,
        easing: updatedOptions.timing?.easing || AnimationEasing.EASE_IN_OUT
      },
      customKeyframes: updatedOptions.customKeyframes || ''
    });
  };

  return (
    <div className={`animation-selector ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Logo Animation</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Animation Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => {
              setSelectedType(null);
              setShowCustomOptions(false);
            }}
            className="text-sm"
          >
            None
          </Button>
          
          {animationTemplates.map(template => (
            <Button
              key={template.id}
              variant={selectedType === template.defaultOptions.type ? "default" : "outline"}
              onClick={() => {
                setSelectedType(template.defaultOptions.type);
                setShowCustomOptions(false);
              }}
              className="text-sm"
            >
              {template.name}
            </Button>
          ))}
          
          <Button
            variant={selectedType === AnimationType.CUSTOM ? "default" : "outline"}
            onClick={() => {
              setSelectedType(AnimationType.CUSTOM);
              setShowCustomOptions(true);
            }}
            className="text-sm"
          >
            Custom
          </Button>
        </div>
      </div>
      
      {showCustomOptions && (
        <Card className="p-4">
          <h4 className="text-md font-medium mb-3">Custom Animation Options</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (ms)</label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={customOptions.timing?.duration || 1000}
                onChange={(e) => handleCustomOptionsChange({
                  timing: { ...customOptions.timing, duration: parseInt(e.target.value) }
                })}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Easing</label>
              <select
                value={customOptions.timing?.easing || AnimationEasing.EASE_IN_OUT}
                onChange={(e) => handleCustomOptionsChange({
                  timing: { ...customOptions.timing, easing: e.target.value as AnimationEasing }
                })}
                className="w-full p-2 border rounded"
              >
                <option value={AnimationEasing.LINEAR}>Linear</option>
                <option value={AnimationEasing.EASE}>Ease</option>
                <option value={AnimationEasing.EASE_IN}>Ease In</option>
                <option value={AnimationEasing.EASE_OUT}>Ease Out</option>
                <option value={AnimationEasing.EASE_IN_OUT}>Ease In Out</option>
                <option value={AnimationEasing.ELASTIC}>Elastic</option>
                <option value={AnimationEasing.BOUNCE}>Bounce</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Custom Keyframes (CSS)</label>
              <textarea
                value={customOptions.customKeyframes || ''}
                onChange={(e) => handleCustomOptionsChange({ customKeyframes: e.target.value })}
                placeholder="0% { opacity: 0; }\n100% { opacity: 1; }"
                className="w-full p-2 border rounded h-32 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter CSS keyframes without the @keyframes wrapper
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {selectedType && (
        <div className="mt-4">
          <AnimationPreview 
            animationType={selectedType} 
            customOptions={selectedType === AnimationType.CUSTOM ? customOptions : undefined}
          />
        </div>
      )}
    </div>
  );
}

// Animation preview component
interface AnimationPreviewProps {
  animationType: AnimationType;
  customOptions?: Partial<AnimationOptions>;
}

function AnimationPreview({ animationType, customOptions }: AnimationPreviewProps) {
  // Get the selected animation template
  const template = animationType === AnimationType.CUSTOM
    ? null
    : animationTemplates.find(t => t.defaultOptions.type === animationType);
  
  // Generate a simple SVG for preview
  const sampleSvg = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#4f46e5" />
      <path d="M30 50 L70 50 M50 30 L50 70" stroke="white" stroke-width="8" stroke-linecap="round" />
    </svg>
  `;
  
  // Generate CSS for animation preview
  const getPreviewCss = () => {
    if (animationType === AnimationType.CUSTOM && customOptions) {
      return `
        .preview-animation {
          animation: customPreview 
            ${customOptions.timing?.duration || 1000}ms 
            ${customOptions.timing?.easing || 'ease-in-out'} 
            infinite alternate;
        }
        
        @keyframes customPreview {
          ${customOptions.customKeyframes || `
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          `}
        }
      `;
    }
    
    switch (animationType) {
      case AnimationType.FADE_IN:
        return `
          .preview-animation {
            animation: fadeInPreview 1.5s ease-in-out infinite alternate;
          }
          @keyframes fadeInPreview {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `;
      case AnimationType.ZOOM_IN:
        return `
          .preview-animation {
            animation: zoomInPreview 1.5s ease-out infinite alternate;
          }
          @keyframes zoomInPreview {
            0% { opacity: 0; transform: scale(0.5); }
            100% { opacity: 1; transform: scale(1); }
          }
        `;
      case AnimationType.SPIN:
        return `
          .preview-animation {
            animation: spinPreview 2s linear infinite;
          }
          @keyframes spinPreview {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
      case AnimationType.DRAW:
        return `
          .preview-animation path {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: drawPreview 2s ease-in-out infinite alternate;
          }
          @keyframes drawPreview {
            0% { stroke-dashoffset: 1000; }
            100% { stroke-dashoffset: 0; }
          }
        `;
      case AnimationType.SEQUENTIAL:
        return `
          .preview-animation {
            animation: sequentialPreview 2s ease-in-out infinite alternate;
          }
          @keyframes sequentialPreview {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `;
      case AnimationType.PULSE:
        return `
          .preview-animation {
            animation: pulsePreview 1.5s ease-in-out infinite;
          }
          @keyframes pulsePreview {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `;
      case AnimationType.BOUNCE:
        return `
          .preview-animation {
            animation: bouncePreview 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite alternate;
          }
          @keyframes bouncePreview {
            0% { transform: translateY(0); }
            100% { transform: translateY(-20px); }
          }
        `;
      default:
        return `
          .preview-animation {
            animation: defaultPreview 1.5s ease-in-out infinite alternate;
          }
          @keyframes defaultPreview {
            0% { opacity: 0.7; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `;
    }
  };

  return (
    <div className="animation-preview">
      <h4 className="text-sm font-medium mb-2">Preview</h4>
      
      <div className="border rounded p-4 bg-gray-50 flex justify-center">
        <style>{getPreviewCss()}</style>
        <div 
          className="preview-animation"
          dangerouslySetInnerHTML={{ __html: sampleSvg }}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        {template?.description || "Custom animation preview"}
      </div>
    </div>
  );
}