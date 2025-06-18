'use client'

import React from 'react';
import { Fingerprint } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface UniquenessToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function UniquenessToggle({ enabled, onToggle, className = '' }: UniquenessToggleProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Fingerprint className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <Label htmlFor="uniqueness-analysis" className="font-medium text-sm">
              Industry Uniqueness Analysis
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Analyze your logo against industry competitors to ensure uniqueness
            </p>
          </div>
        </div>
        
        <Switch
          id="uniqueness-analysis"
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label="Enable uniqueness analysis"
        />
      </div>
    </Card>
  );
}