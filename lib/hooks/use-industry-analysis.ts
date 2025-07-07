'use client';

import { useState, useEffect, useCallback } from 'react';
import { IndustryAnalysisService } from '../services/industry-analysis-service';
import { DesignSpec } from '../types';
import { CompetitorLogo, IndustryTrend } from '../types-agents';

interface IndustryAnalysisState {
  isLoading: boolean;
  error: string | null;
  industryName: string;
  confidence: number;
  competitorLogos: CompetitorLogo[];
  industryTrends: IndustryTrend[];
  designRecommendations: string[];
  uniquenessScore: number;
  conventionScore: number;
  balanceAnalysis: string;
}

interface UseIndustryAnalysisOptions {
  onAnalysisComplete?: (result: Omit<IndustryAnalysisState, 'isLoading' | 'error'>) => void;
}

const defaultState: IndustryAnalysisState = {
  isLoading: false,
  error: null,
  industryName: '',
  confidence: 0,
  competitorLogos: [],
  industryTrends: [],
  designRecommendations: [],
  uniquenessScore: 0,
  conventionScore: 0,
  balanceAnalysis: '',
};

/**
 * Hook for analyzing logos within industry context
 */
export function useIndustryAnalysis(options: UseIndustryAnalysisOptions = {}) {
  const [state, setState] = useState<IndustryAnalysisState>(defaultState);
  const [service] = useState(() => new IndustryAnalysisService());

  /**
   * Analyze a logo design in its industry context
   */
  const analyzeLogoInIndustry = useCallback(
    async (brandName: string, industry: string, designSpec: DesignSpec, svg?: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await service.analyzeIndustryContext(brandName, industry, designSpec, svg);

        if (result.success && result.result) {
          const analysisData = {
            industryName: result.result.industryName,
            confidence: result.result.confidence,
            competitorLogos: result.result.competitorLogos,
            industryTrends: result.result.industryTrends,
            designRecommendations: result.result.designRecommendations,
            uniquenessScore: result.result.uniquenessScore,
            conventionScore: result.result.conventionScore,
            balanceAnalysis: result.result.balanceAnalysis,
          };

          setState(prev => ({
            ...prev,
            ...analysisData,
            isLoading: false,
          }));

          // Call the callback if provided
          if (options.onAnalysisComplete) {
            options.onAnalysisComplete(analysisData);
          }

          return analysisData;
        } else {
          throw new Error(result.error?.message || 'Industry analysis failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        throw error;
      }
    },
    [service, options]
  );

  /**
   * Detect the industry for a brand based on its description
   */
  const detectIndustry = useCallback(
    async (designSpec: DesignSpec) => {
      try {
        return await service.detectIndustry(designSpec);
      } catch (error) {
        console.error('Industry detection failed:', error);
        return { industry: 'General Business', confidence: 0.5 };
      }
    },
    [service]
  );

  return {
    ...state,
    analyzeLogoInIndustry,
    detectIndustry,
    resetAnalysis: () => setState(defaultState),
  };
}
