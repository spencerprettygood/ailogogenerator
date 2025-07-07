'use client';

import React, { useState } from 'react';
import { AnimationType, AnimationEasing, AnimationOptions } from '../../lib/animation/types';

interface AnimationSelectorProps {
  onSelectAnimation: (options: AnimationOptions) => void;
  className?: string;
  initialType?: AnimationType;
}

/**
 * Component for selecting animation types and options
 *
 * This component provides a UI for selecting different animation types
 * and basic customization options like duration and easing.
 */
export function AnimationSelector({
  onSelectAnimation,
  className = '',
  initialType = AnimationType.FADE_IN,
}: AnimationSelectorProps) {
  const [selectedType, setSelectedType] = useState<AnimationType>(initialType);
  const [duration, setDuration] = useState<number>(1000);
  const [easing, setEasing] = useState<AnimationEasing>(AnimationEasing.EASE_OUT);

  // Animation options
  const animations = [
    { type: AnimationType.FADE_IN, name: 'Fade In', description: 'Simple fade-in effect' },
    { type: AnimationType.ZOOM_IN, name: 'Zoom In', description: 'Scale up from smaller size' },
    { type: AnimationType.SPIN, name: 'Spin', description: 'Rotate around center' },
    { type: AnimationType.DRAW, name: 'Draw', description: 'Path drawing effect' },
    { type: AnimationType.PULSE, name: 'Pulse', description: 'Pulsating scale effect' },
  ];

  // Easing options
  const easingOptions = [
    { value: AnimationEasing.LINEAR, name: 'Linear' },
    { value: AnimationEasing.EASE, name: 'Ease' },
    { value: AnimationEasing.EASE_IN, name: 'Ease In' },
    { value: AnimationEasing.EASE_OUT, name: 'Ease Out' },
    { value: AnimationEasing.EASE_IN_OUT, name: 'Ease In Out' },
  ];

  // Handle animation selection
  const handleSelectAnimation = (type: AnimationType) => {
    setSelectedType(type);

    // Create animation options and notify parent
    const options: AnimationOptions = {
      type,
      timing: {
        duration,
        easing,
        delay: 0,
        iterations: 1,
      },
    };

    onSelectAnimation(options);
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value);
    setDuration(newDuration);

    // Update animation options
    const options: AnimationOptions = {
      type: selectedType,
      timing: {
        duration: newDuration,
        easing,
        delay: 0,
        iterations: 1,
      },
    };

    onSelectAnimation(options);
  };

  // Handle easing change
  const handleEasingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEasing = e.target.value as AnimationEasing;
    setEasing(newEasing);

    // Update animation options
    const options: AnimationOptions = {
      type: selectedType,
      timing: {
        duration,
        easing: newEasing,
        delay: 0,
        iterations: 1,
      },
    };

    onSelectAnimation(options);
  };

  return (
    <div className={`animation-selector ${className}`}>
      <h3 className="text-lg font-medium mb-3">Choose Animation Style</h3>

      {/* Animation type selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {animations.map(animation => (
          <div
            key={animation.type}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedType === animation.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleSelectAnimation(animation.type)}
          >
            <div className="font-medium">{animation.name}</div>
            <div className="text-sm text-gray-500">{animation.description}</div>
          </div>
        ))}
      </div>

      {/* Animation options */}
      <div className="space-y-4">
        {/* Duration slider */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration: {duration}ms</label>
          <input
            type="range"
            min="100"
            max="3000"
            step="100"
            value={duration}
            onChange={handleDurationChange}
            className="w-full"
          />
        </div>

        {/* Easing function selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Easing Function</label>
          <select
            value={easing}
            onChange={handleEasingChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {easingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
