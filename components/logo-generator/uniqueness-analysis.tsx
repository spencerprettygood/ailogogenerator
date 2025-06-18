'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { UniquenessAnalysisResult, CompetitorLogo } from '@/lib/types';
import { AlertTriangle, CheckCircle, Info, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';

interface UniquenessAnalysisProps {
  analysis: UniquenessAnalysisResult;
  className?: string;
}

export function UniquenessAnalysis({ analysis, className = '' }: UniquenessAnalysisProps) {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-amber-600';
    if (score >= 25) return 'text-blue-600';
    return 'text-green-600';
  };

  // Round score to the nearest whole number
  const uniquenessScore = Math.round(analysis.uniquenessScore);
  
  return (
    <div className={`bg-white rounded-lg shadow p-5 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1 flex items-center">
          <ThumbsUp className="w-5 h-5 mr-2" />
          Logo Uniqueness Analysis
        </h3>
        <p className="text-gray-600 text-sm">
          Analysis of your logo's uniqueness compared to industry competitors
        </p>
      </div>
      
      {/* Score and assessment */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4">
          <div>
            <div className="text-center mb-1 text-sm font-medium text-gray-500">Uniqueness Score</div>
            <div className={`text-4xl font-bold text-center ${getScoreColor(uniquenessScore)}`}>
              {uniquenessScore}<span className="text-sm">/100</span>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500 mb-1">Overall Assessment</div>
          <p className="text-gray-700">
            {analysis.analysis.overallAssessment}
          </p>
        </div>
      </div>
      
      {/* Detailed analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Unique Elements
          </h4>
          <ul className="space-y-1">
            {analysis.analysis.uniqueElements.map((element, i) => (
              <li key={`unique-${i}`} className="text-sm text-gray-700 flex items-start">
                <span className="text-green-500 mr-2">•</span>
                {element}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
            Potential Issues
          </h4>
          <ul className="space-y-1">
            {analysis.analysis.potentialIssues.length > 0 ? (
              analysis.analysis.potentialIssues.map((issue, i) => (
                <li key={`issue-${i}`} className="text-sm text-gray-700 flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  {issue}
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-700">No significant issues detected</li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Industry conventions and differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-500" />
            Industry Conventions
          </h4>
          <ul className="space-y-1">
            {analysis.analysis.industryConventions.map((convention, i) => (
              <li key={`convention-${i}`} className="text-sm text-gray-700 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {convention}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <ThumbsUp className="w-4 h-4 mr-2 text-indigo-500" />
            Key Differentiators
          </h4>
          <ul className="space-y-1">
            {analysis.analysis.differentiators.map((differentiator, i) => (
              <li key={`differentiator-${i}`} className="text-sm text-gray-700 flex items-start">
                <span className="text-indigo-500 mr-2">•</span>
                {differentiator}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Similar logos */}
      {analysis.similarLogos.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Similar Logos in the Industry</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {analysis.similarLogos.map((logo) => (
              <div key={logo.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-sm">{logo.companyName}</h5>
                  <Badge variant="outline" className={getSimilarityColor(logo.similarityScore)}>
                    {Math.round(logo.similarityScore)}% similar
                  </Badge>
                </div>
                
                <ul className="space-y-1 mt-2">
                  {logo.similarElements.map((element, i) => (
                    <li key={`similar-${logo.id}-${i}`} className="text-xs text-gray-600 flex items-start">
                      <span className="text-gray-400 mr-1">•</span>
                      {element}
                    </li>
                  ))}
                </ul>
                
                {logo.imageUrl && (
                  <div className="mt-2 flex justify-end">
                    <a 
                      href={logo.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View logo
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      <div>
        <h4 className="font-medium mb-3">Recommendations</h4>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <div 
              key={`rec-${i}`} 
              className={`text-sm border rounded-lg p-3 ${getSeverityColor(rec.severity)}`}
            >
              {rec.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}