'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  IndustryAnalysis,
  SVGLogo,
  PotentialIssue
} from '@/lib/types';
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
  analysis: IndustryAnalysis;
  onApplyRecommendation?: (recommendation: string) => void;
  className?: string;
}

export function UniquenessAnalysis({
  analysis,
  onApplyRecommendation,
  className = ''
}: UniquenessAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // No need to fetch analysis, it's passed in.
  const displayedAnalysis = analysis;

  if (!displayedAnalysis) {
    return <div>No analysis data provided.</div>;
  }

  const { score, potential_issues, verification_details } = analysis;

  const renderScoreBadge = () => {
    if (score >= 90) return { color: 'bg-green-500', label: 'Excellent' };
    if (score >= 80) return { color: 'bg-green-400', label: 'Very Good' };
    if (score >= 70) return { color: 'bg-yellow-400', label: 'Good' };
    if (score >= 50) return { color: 'bg-orange-400', label: 'Fair' };
    return { color: 'bg-red-500', label: 'Poor' };
  };

  // Handle clicking on a recommendation
  const handleRecommendationClick = (recommendation: string) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(recommendation);
    }
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2" /> Uniqueness Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Progress value={score} className="w-full" />
          <span className="ml-4 font-bold text-lg">{score}%</span>
        </div>
        {renderScoreBadge()}

        {potential_issues && potential_issues.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2 flex items-center"><AlertTriangle className="mr-2" /> Potential Issues</h4>
            <div className="space-y-4">
              {potential_issues.map((issue: PotentialIssue, index: number) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="font-semibold">{issue.description}</p>
                  <p className="text-sm text-gray-600">Severity: {issue.severity}</p>
                  {issue.recommendations && issue.recommendations.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-semibold text-sm">Recommendations:</h5>
                      <ul className="list-disc list-inside text-sm">
                        {issue.recommendations.map((rec: string, recIndex: number) => (
                          <li key={recIndex}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {verification_details && (
           <div className="mt-6">
            <h4 className="font-semibold mb-2 flex items-center"><Info className="mr-2" /> Verification Details</h4>
            <p className="text-sm text-gray-600">{verification_details}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}