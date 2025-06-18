import React from 'react';
import { Switch } from '@/components/ui/switch';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

interface UniquenessToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export const UniquenessToggle: React.FC<UniquenessToggleProps> = ({
  enabled,
  onToggle,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        <span className="text-sm font-medium mr-2">Include uniqueness analysis</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoCircledIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Analyzes your logo against common designs in your industry to ensure originality.
                This helps prevent accidental similarity to existing brands.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        aria-label="Toggle uniqueness analysis"
      />
    </div>
  );
};