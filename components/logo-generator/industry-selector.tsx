'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown } from 'lucide-react';

interface IndustrySelectorProps {
  detectedIndustry: string;
  detectedConfidence: number;
  onSelectIndustry: (industry: string) => void;
}

const INDUSTRIES = [
  { id: 'technology', name: 'Technology' },
  { id: 'finance', name: 'Finance' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'education', name: 'Education' },
  { id: 'food', name: 'Food & Restaurant' },
  { id: 'retail', name: 'Retail' },
  { id: 'travel', name: 'Travel & Hospitality' },
  { id: 'creative', name: 'Creative & Art' },
  { id: 'sports', name: 'Sports & Fitness' },
  { id: 'general', name: 'General Business' }
];

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  detectedIndustry,
  detectedConfidence,
  onSelectIndustry
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState(detectedIndustry || 'general');
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelectIndustry = (industry: string) => {
    setSelectedIndustry(industry);
    onSelectIndustry(industry);
    setIsOpen(false);
  };

  // Find selected industry name
  const selectedIndustryName = INDUSTRIES.find(i => i.id === selectedIndustry)?.name || 'General Business';

  return (
    <div>
      <p className="text-sm font-medium mb-2">Industry (helps optimize the logo style)</p>
      
      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedIndustryName}</span>
          <ChevronDown size={16} />
        </Button>
        
        {isOpen && (
          <div className="absolute mt-1 w-full z-10 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
            <div className="py-1">
              {INDUSTRIES.map((industry) => (
                <div
                  key={industry.id}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedIndustry === industry.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => handleSelectIndustry(industry.id)}
                >
                  <span>{industry.name}</span>
                  {selectedIndustry === industry.id && <Check size={16} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {detectedIndustry && detectedConfidence > 0.7 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <span className="mr-2">Detected industry:</span>
          <Badge variant="outline" className="text-xs">
            {INDUSTRIES.find(i => i.id === detectedIndustry)?.name || 'General Business'}
          </Badge>
          <span className="ml-2">({Math.round(detectedConfidence * 100)}% confidence)</span>
        </div>
      )}
    </div>
  );
};