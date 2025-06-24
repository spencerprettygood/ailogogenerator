'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SVGLogo } from '@/lib/types';
import { 
  UniquenessVerificationResult
} from '@/lib/agents/specialized/uniqueness-verification-agent';
import { 
  Fingerprint,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  Award,
  Lightbulb,
  AlertCircle,
  Shield,
  RefreshCw
} from 'lucide-react';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';

interface UniquenessAnalysisProps {
  logo: SVGLogo;
  brandName: string;
  industry?: string;
  onApplyRecommendation?: (recommendation: string) => void;
  className?: string;
}

export function UniquenessAnalysis({
  logo,
  brandName,
  industry,
  onApplyRecommendation,
  className = ''
}: UniquenessAnalysisProps) {
  const [analysis, setAnalysis] = useState<UniquenessVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load analysis when component mounts or logo changes
  useEffect(() => {
    if (logo) {
      analyzeUniqueness();
    }
  }, [logo]);
  
  // Function to request uniqueness analysis
  const analyzeUniqueness = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a production environment, this would call an API endpoint
      // For this demo, we'll simulate a response after a delay
      setTimeout(() => {
        // Generate mock analysis with a randomized score for demo purposes
        const mockScore = Math.floor(Math.random() * 40) + 60; // 60-99 range
        const mockAnalysis: UniquenessVerificationResult = generateMockAnalysis(mockScore);
        
        setAnalysis(mockAnalysis);
        setIsLoading(false);
      }, 2500);
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.NETWORK,
        context: {
          component: 'UniquenessAnalysis',
          operation: 'analyzeUniqueness',
          brandName
        }
      });
      
      setError('Failed to analyze logo uniqueness. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Generate mock analysis with a specific score
  const generateMockAnalysis = (score: number): UniquenessVerificationResult => {
    // Adjust issues based on score
    const issueCount = score >= 90 ? 0 : score >= 80 ? 1 : score >= 70 ? 2 : 3;
    
    // Potential issues to select from
    const potentialIssues = [
      {
        description: "The color palette contains commonly used combinations in this industry",
        severity: "low" as const,
        elementType: "color" as const,
        recommendations: [
          "Consider introducing an unexpected accent color to the palette",
          "Try shifting the primary color to a less common hue for this industry"
        ]
      },
      {
        description: "The geometric shape structure is similar to several existing logos",
        severity: "medium" as const,
        elementType: "shape" as const,
        recommendations: [
          "Introduce more organic elements to contrast with the geometric structure",
          "Consider a more distinctive arrangement of the existing shapes"
        ]
      },
      {
        description: "The typography style is fairly standard for this industry",
        severity: "low" as const,
        elementType: "typography" as const,
        recommendations: [
          "Explore custom letterforms to add distinctiveness",
          "Consider more dramatic weight contrast in the typography"
        ]
      },
      {
        description: "The overall concept follows common industry trends",
        severity: "medium" as const,
        elementType: "concept" as const,
        recommendations: [
          "Consider introducing a more unexpected metaphor or concept",
          "Try approaching the brand concept from a different perspective"
        ]
      },
      {
        description: "The composition layout is conventional and could be mistaken for other brands",
        severity: "high" as const,
        elementType: "composition" as const,
        recommendations: [
          "Experiment with more dynamic or asymmetrical compositions",
          "Consider a more distinctive focal point in the layout"
        ]
      }
    ];
    
    // Select random issues based on the issue count
    const shuffled = [...potentialIssues].sort(() => 0.5 - Math.random());
    const selectedIssues = shuffled.slice(0, issueCount);
    
    // General recommendations
    const generalRecommendations = [
      "Maintain the current distinctive elements that set your logo apart",
      "Consider trademark registration to protect your visual identity",
      "Ensure consistent application across all brand touchpoints",
      score < 80 ? "Review the specific similarity issues to increase uniqueness" : null,
      score < 70 ? "Consider more substantial design revisions to improve distinctiveness" : null
    ].filter(Boolean) as string[];
    
    return {
      isUnique: score >= 70,
      uniquenessScore: score,
      similarityIssues: selectedIssues,
      recommendations: generalRecommendations
    };
  };
  
  // Handle clicking on a recommendation
  const handleRecommendationClick = (recommendation: string) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(recommendation);
    }
  };
  
  // Get score color and label
  const getScoreInfo = (score: number) => {
    if (score >= 90) return { color: 'bg-green-500', label: 'Excellent' };
    if (score >= 80) return { color: 'bg-green-400', label: 'Very Good' };
    if (score >= 70) return { color: 'bg-yellow-400', label: 'Good' };
    if (score >= 50) return { color: 'bg-orange-400', label: 'Fair' };
    return { color: 'bg-red-500', label: 'Poor' };
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Fingerprint className="h-5 w-5 mr-1.5" />
            <span>Uniqueness Analysis</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={analyzeUniqueness} 
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh Analysis</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded animate-pulse w-1/3"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
              </div>
            </div>
            <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-5/6"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-4/6"></div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-red-500 py-3">
            <AlertCircle className="h-5 w-5" />
            <div className="text-sm">{error}</div>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Score section */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Uniqueness Score</div>
                <div className="flex items-center">
                  <Badge className={`${getScoreInfo(analysis.uniquenessScore).color} text-white`}>
                    {getScoreInfo(analysis.uniquenessScore).label}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={analysis.uniquenessScore} 
                className="h-2"
                indicatorClassName={getScoreInfo(analysis.uniquenessScore).color}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Generic</span>
                <span>Distinctive</span>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className={`p-2 rounded-md ${
              analysis.isUnique 
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50' 
                : 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50'
            }`}>
              <div className="flex items-start">
                {analysis.isUnique ? (
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <div>
                  <div className={`text-sm font-medium ${
                    analysis.isUnique ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {analysis.isUnique 
                      ? 'Your logo appears to be distinctive' 
                      : 'Your logo has some similarity concerns'}
                  </div>
                  <div className={`text-xs ${
                    analysis.isUnique ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {analysis.isUnique 
                      ? 'The design has sufficient unique characteristics to stand out in your industry.' 
                      : 'Consider the recommendations below to improve distinctiveness.'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Issues section */}
            {analysis.similarityIssues.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Potential Similarity Issues</div>
                {analysis.similarityIssues.map((issue, index) => (
                  <div key={index} className="text-sm p-2 bg-muted/40 rounded-md">
                    <div className="flex items-start mb-1">
                      <div className={`
                        h-5 w-5 flex items-center justify-center rounded-full mr-2 flex-shrink-0
                        ${issue.severity === 'high' ? 'bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400' : 
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400' : 
                          'bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-400'}
                      `}>
                        {issue.severity === 'high' ? '!' : 
                         issue.severity === 'medium' ? '!!' : 'i'}
                      </div>
                      <div>
                        <div className="font-medium mb-1">{issue.description}</div>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <Badge variant="outline" className="text-xs py-0">
                            {issue.elementType}
                          </Badge>
                          <Badge variant="outline" className={`
                            text-xs py-0
                            ${issue.severity === 'high' ? 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400' : 
                              issue.severity === 'medium' ? 'border-yellow-200 text-yellow-600 dark:border-yellow-800 dark:text-yellow-400' : 
                              'border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400'}
                          `}>
                            {issue.severity} concern
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium mb-0.5">Suggestions:</div>
                          <ul className="list-disc pl-4 space-y-1">
                            {issue.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleRecommendationClick(rec)}>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Recommendations section */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center">
                <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                <span>Recommendations</span>
              </div>
              <div className="space-y-1 text-sm">
                {analysis.recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className="flex items-start py-1 px-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleRecommendationClick(rec)}
                  >
                    <div className="mr-2 mt-0.5 text-muted-foreground">•</div>
                    <div>{rec}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legal note */}
            <div className="text-xs text-muted-foreground pt-2 flex items-start">
              <Shield className="h-3 w-3 mr-1 mt-0.5" />
              <span>This analysis is for guidance only and doesn't replace professional legal advice on trademark matters.</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Eye className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No uniqueness analysis available yet.</p>
            <p className="text-xs">Click the refresh button to analyze your logo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}