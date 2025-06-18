import React from 'react';
import { TestVariant } from '../types';

interface AbVariantSelectorProps {
  testId: string;
  variants: {
    [key in TestVariant]?: {
      name: string;
      description: string;
    }
  };
  selectedVariant: TestVariant;
  onSelectVariant: (variant: TestVariant) => void;
  className?: string;
}

/**
 * Component for manually selecting test variants during development
 * Only visible in development mode
 */
export const AbVariantSelector: React.FC<AbVariantSelectorProps> = ({
  testId,
  variants,
  selectedVariant,
  onSelectVariant,
  className = ''
}) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`bg-gray-100 border border-gray-300 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">A/B Test: {testId}</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Dev Only</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Select a variant to test. This control is only visible in development.
      </p>
      
      <div className="grid gap-2">
        {Object.entries(variants).map(([variant, details]) => (
          <button
            key={variant}
            onClick={() => onSelectVariant(variant as TestVariant)}
            className={`text-left p-3 rounded-md border transition-colors ${
              selectedVariant === variant 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Variant {variant}: {details?.name || 'Unnamed'}
              </span>
              
              {selectedVariant === variant && (
                <span className="text-blue-600 text-sm font-medium">
                  Selected
                </span>
              )}
            </div>
            
            {details?.description && (
              <p className="mt-1 text-sm text-gray-600">
                {details.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AbVariantSelector;