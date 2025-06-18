import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UniquenessAnalysis as UniquenessAnalysisType } from '@/lib/types';
import { AlertTriangle, Check } from 'lucide-react';

interface UniquenessAnalysisProps {
  analysis: UniquenessAnalysisType;
}

export const UniquenessAnalysis: React.FC<UniquenessAnalysisProps> = ({
  analysis
}) => {
  // Get uniqueness level based on score
  const getUniquenessLevel = (score: number) => {
    if (score >= 85) return { label: 'Highly Unique', color: 'text-green-600 dark:text-green-500' };
    if (score >= 70) return { label: 'Unique', color: 'text-blue-600 dark:text-blue-500' };
    if (score >= 50) return { label: 'Moderately Unique', color: 'text-yellow-600 dark:text-yellow-500' };
    return { label: 'Low Uniqueness', color: 'text-red-600 dark:text-red-500' };
  };

  // Calculate progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-green-600';
    if (score >= 70) return 'bg-blue-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const uniquenessLevel = getUniquenessLevel(analysis.score);
  const progressColor = getProgressColor(analysis.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Uniqueness Analysis</span>
          <Badge className={uniquenessLevel.color}>
            {uniquenessLevel.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall score */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Overall Uniqueness Score</span>
            <span className="text-sm font-bold">{analysis.score}/100</span>
          </div>
          <Progress value={analysis.score} className={progressColor} />
        </div>
        
        {/* Uniqueness factors */}
        {analysis.uniquenessFactors && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Uniqueness Factors</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Shape</span>
                  <span>{analysis.uniquenessFactors.shape}/100</span>
                </div>
                <Progress value={analysis.uniquenessFactors.shape} className={getProgressColor(analysis.uniquenessFactors.shape)} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Color</span>
                  <span>{analysis.uniquenessFactors.color}/100</span>
                </div>
                <Progress value={analysis.uniquenessFactors.color} className={getProgressColor(analysis.uniquenessFactors.color)} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Style</span>
                  <span>{analysis.uniquenessFactors.style}/100</span>
                </div>
                <Progress value={analysis.uniquenessFactors.style} className={getProgressColor(analysis.uniquenessFactors.style)} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Concept</span>
                  <span>{analysis.uniquenessFactors.concept}/100</span>
                </div>
                <Progress value={analysis.uniquenessFactors.concept} className={getProgressColor(analysis.uniquenessFactors.concept)} />
              </div>
            </div>
          </div>
        )}
        
        {/* Industry distinctiveness */}
        {analysis.industryDistinctiveness !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Industry Distinctiveness</span>
              <span className="text-sm font-medium">{analysis.industryDistinctiveness}/100</span>
            </div>
            <Progress value={analysis.industryDistinctiveness} className={getProgressColor(analysis.industryDistinctiveness)} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              How unique your logo is compared to common design patterns in your industry.
            </p>
          </div>
        )}
        
        {/* Similar logos */}
        {analysis.similarLogos && analysis.similarLogos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center">
              <AlertTriangle size={16} className="mr-1 text-yellow-500" />
              Potential Similarities Found
            </h4>
            <div className="space-y-3">
              {analysis.similarLogos.map((logo, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  {logo.imageUrl && (
                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                      <img src={logo.imageUrl} alt={logo.name} className="max-w-full max-h-full" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{logo.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {logo.similarity}% similarity
                    </div>
                    {logo.description && (
                      <div className="text-xs mt-1">{logo.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Suggested changes */}
        {analysis.suggestedChanges && analysis.suggestedChanges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Suggested Improvements</h4>
            <ul className="space-y-2">
              {analysis.suggestedChanges.map((change, index) => (
                <li key={index} className="text-sm flex items-start">
                  <Check size={16} className="mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};