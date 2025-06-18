'use client'

import { useState, useEffect } from 'react';
import { useIndustryAnalysis } from '../../lib/hooks/use-industry-analysis';
import { IndustryAnalysis } from './industry-analysis';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, XCircle } from 'lucide-react';

interface IndustrySearchInterfaceProps {
  brandName: string;
  designSpec?: any;
  svgCode?: string;
  onIndustrySelect?: (industry: string) => void;
  className?: string;
}

export function IndustrySearchInterface({
  brandName,
  designSpec,
  svgCode,
  onIndustrySelect,
  className = ''
}: IndustrySearchInterfaceProps) {
  const [industryQuery, setIndustryQuery] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const {
    isLoading,
    error,
    industryName,
    confidence,
    competitorLogos,
    industryTrends,
    designRecommendations,
    uniquenessScore,
    conventionScore,
    balanceAnalysis,
    analyzeLogoInIndustry,
    detectIndustry
  } = useIndustryAnalysis();

  // Common industries for suggestions
  const COMMON_INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Food & Beverage', 'Real Estate', 'Entertainment', 'Manufacturing',
    'Consulting', 'Transportation', 'Hospitality', 'Media', 'Fashion',
    'Sports', 'Energy', 'Agriculture', 'Construction', 'Legal',
    'Non-profit', 'Beauty', 'Automotive', 'Telecommunications'
  ];

  // Auto-detect industry when designSpec changes
  useEffect(() => {
    if (designSpec && !industryName && !searchPerformed) {
      handleAutoDetectIndustry();
    }
  }, [designSpec]);

  const handleSearch = async () => {
    if (!industryQuery.trim()) return;
    
    setSearchPerformed(true);
    
    try {
      if (designSpec) {
        await analyzeLogoInIndustry(
          brandName,
          industryQuery,
          designSpec,
          svgCode
        );
        
        // Notify parent component of industry selection
        if (onIndustrySelect) {
          onIndustrySelect(industryQuery);
        }
      }
    } catch (error) {
      console.error('Error analyzing industry:', error);
    }
  };

  const handleAutoDetectIndustry = async () => {
    if (!designSpec) return;
    
    try {
      const { industry, confidence } = await detectIndustry(designSpec);
      setIndustryQuery(industry);
      
      // Automatically perform the search with the detected industry
      await analyzeLogoInIndustry(
        brandName,
        industry,
        designSpec,
        svgCode
      );
      
      setSearchPerformed(true);
      
      // Notify parent component of industry selection
      if (onIndustrySelect) {
        onIndustrySelect(industry);
      }
    } catch (error) {
      console.error('Error auto-detecting industry:', error);
    }
  };

  const clearSearch = () => {
    setIndustryQuery('');
    setSearchPerformed(false);
  };

  const selectIndustrySuggestion = (industry: string) => {
    setIndustryQuery(industry);
    // Automatically search with the selected industry
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  return (
    <div className={className}>
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="font-medium mb-2">Industry Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze your logo design in the context of industry competitors and trends to ensure uniqueness while following conventions.
          </p>
          
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <Input
                placeholder="Enter industry (e.g., Technology, Healthcare, Finance)"
                value={industryQuery}
                onChange={(e) => setIndustryQuery(e.target.value)}
                className="pr-8"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {industryQuery && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={clearSearch}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !industryQuery.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Analyze
            </Button>
          </div>
          
          {error && (
            <p className="text-sm text-red-500 mt-2">
              Error: {error}
            </p>
          )}
          
          {!searchPerformed && !isLoading && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Popular industries:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_INDUSTRIES.slice(0, 10).map((industry) => (
                  <Button
                    key={industry}
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 h-auto"
                    onClick={() => selectIndustrySuggestion(industry)}
                  >
                    {industry}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Results Display */}
        {searchPerformed && !isLoading && !error && industryName && (
          <IndustryAnalysis
            industryName={industryName}
            confidence={confidence}
            competitorLogos={competitorLogos}
            industryTrends={industryTrends}
            designRecommendations={designRecommendations}
            uniquenessScore={uniquenessScore}
            conventionScore={conventionScore}
            balanceAnalysis={balanceAnalysis}
          />
        )}
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Analyzing industry context...</p>
          </div>
        )}
      </Card>
    </div>
  );
}