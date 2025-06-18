/**
 * Industry Selector Component
 * 
 * Allows users to select or override the detected industry category for logo generation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { INDUSTRY_TEMPLATES } from '../../lib/industry-templates';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface IndustrySelectorProps {
  detectedIndustry?: string;
  detectedConfidence?: number;
  onSelectIndustry: (industry: string) => void;
  className?: string;
}

export function IndustrySelector({
  detectedIndustry = 'general',
  detectedConfidence = 0,
  onSelectIndustry,
  className = '',
}: IndustrySelectorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(detectedIndustry);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Update selected industry when detected industry changes
  useEffect(() => {
    if (detectedIndustry) {
      setSelectedIndustry(detectedIndustry);
    }
  }, [detectedIndustry]);

  // Handle industry selection
  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value);
    onSelectIndustry(value);
  };

  // Get industries list
  const industries = Object.entries(INDUSTRY_TEMPLATES)
    .map(([id, industry]) => ({
      id,
      name: industry.name,
      description: industry.description
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get confidence label
  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.75) return 'bg-green-50 text-green-700';
    if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-800';
    if (confidence >= 0.4) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
  };

  // Industry selector in collapsed state (just showing the detected industry with confidence)
  const collapsedView = (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Industry:</span>
      <Badge variant="outline" className="font-normal">
        {INDUSTRY_TEMPLATES[selectedIndustry]?.name || 'General'}
      </Badge>
      {detectedConfidence > 0 && (
        <Badge variant="secondary" className={`text-xs ${getConfidenceColor(detectedConfidence)}`}>
          {getConfidenceLabel(detectedConfidence)} confidence
        </Badge>
      )}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsExpanded(true)}
        className="text-xs"
      >
        Change
      </Button>
    </div>
  );

  // Industry selector in expanded state (dropdown menu)
  const expandedView = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Select Industry:</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(false)}
          className="text-xs"
        >
          Done
        </Button>
      </div>
      <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select industry category" />
        </SelectTrigger>
        <SelectContent>
          {industries.map((industry) => (
            <SelectItem key={industry.id} value={industry.id}>
              <div className="flex flex-col">
                <span>{industry.name}</span>
                <span className="text-xs text-gray-500 truncate max-w-[250px]">
                  {industry.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="text-xs text-gray-500 mt-1">
        {INDUSTRY_TEMPLATES[selectedIndustry]?.description || 'Multi-industry or general business applications'}
      </div>
    </div>
  );

  return (
    <div className={`industry-selector rounded-md p-3 border border-gray-200 ${className}`}>
      {isExpanded ? expandedView : collapsedView}
    </div>
  );
}