'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ArrowRight, 
  BarChart, 
  TrendingUp, 
  Check,
  Loader2
} from 'lucide-react';

// Common industries for logo design
const COMMON_INDUSTRIES = [
  'technology', 'finance', 'healthcare', 'food & beverage', 'retail',
  'education', 'real estate', 'fitness', 'beauty', 'e-commerce',
  'gaming', 'media', 'consulting', 'travel', 'non-profit'
];

interface IndustrySearchInterfaceProps {
  brandName?: string;
  designSpec?: any;
  svgCode?: string | null;
  onIndustrySelect: (industry: string) => void;
  className?: string;
}

export function IndustrySearchInterface({
  brandName = 'Your brand',
  designSpec,
  svgCode,
  onIndustrySelect,
  className = '',
}: IndustrySearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  
  // Filter industries based on search query
  const filteredIndustries = COMMON_INDUSTRIES.filter(industry =>
    industry.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Simulate search delay
      setTimeout(() => {
        setIsSearching(false);
      }, 1500);
    }
  };
  
  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
  };
  
  const handleAnalyzeClick = () => {
    if (selectedIndustry) {
      setAnalysisStarted(true);
      onIndustrySelect(selectedIndustry);
    }
  };
  
  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-3 text-sm font-medium">
        Analyze how your logo compares to industry standards
      </div>
      
      <form onSubmit={handleSearch} className="mb-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search industry (e.g., technology, retail)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full aspect-square"
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
      
      {!analysisStarted ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {filteredIndustries.map((industry) => (
              <Button
                key={industry}
                variant={selectedIndustry === industry ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => handleIndustrySelect(industry)}
              >
                {selectedIndustry === industry && (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                )}
                <span className="truncate">{industry}</span>
              </Button>
            ))}
          </div>
          
          <Button
            onClick={handleAnalyzeClick}
            disabled={!selectedIndustry}
            className="w-full"
          >
            <BarChart className="h-4 w-4 mr-2" />
            Analyze {selectedIndustry || 'selected industry'}
          </Button>
        </>
      ) : (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center text-sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Analyzing {brandName} against {selectedIndustry} industry standards...</span>
          </div>
          
          <div className="bg-muted/30 rounded p-2 text-xs text-muted-foreground space-y-2">
            <div className="flex items-start">
              <TrendingUp className="h-3.5 w-3.5 mt-0.5 mr-1.5" />
              <span>Comparing to leading {selectedIndustry} logos</span>
            </div>
            <div className="flex items-start">
              <BarChart className="h-3.5 w-3.5 mt-0.5 mr-1.5" />
              <span>Evaluating uniqueness vs. industry conventions</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}