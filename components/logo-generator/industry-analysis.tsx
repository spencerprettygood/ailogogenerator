'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Building,
  TrendingUp,
  Lightbulb,
  ExternalLink,
  Search,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export interface CompetitorLogo {
  companyName: string;
  logoUrl?: string;
  logoDescription: string;
  dominantColors: string[];
  styleCategory: string;
  visualElements: string[];
  similarityScore?: number; // 0-100 score comparing to user's design/requirements
}

export interface IndustryTrend {
  name: string;
  description: string;
  prevalence: number; // 0-100 indicating how common this trend is
  examples: string[];
}

export interface IndustryAnalysisProps {
  industryName: string;
  confidence?: number; // 0-1 confidence in industry classification
  competitorLogos: CompetitorLogo[];
  industryTrends: IndustryTrend[];
  designRecommendations: string[];
  uniquenessScore: number; // 0-100 score of how unique the logo is
  conventionScore: number; // 0-100 score of how well it follows industry conventions
  balanceAnalysis: string; // Analysis of uniqueness vs. convention balance
  className?: string;
}

export function IndustryAnalysis({
  industryName,
  confidence = 1,
  competitorLogos = [],
  industryTrends = [],
  designRecommendations = [],
  uniquenessScore = 50,
  conventionScore = 50,
  balanceAnalysis = '',
  className = '',
}: IndustryAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'competitors' | 'trends' | 'analysis'>('competitors');

  // Generate a color for uniqueness and convention score display
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-yellow-500';
    if (score < 70) return 'text-blue-500';
    return 'text-green-500';
  };

  // Format display status based on score
  const getScoreStatus = (score: number, isUniqueness: boolean) => {
    if (isUniqueness) {
      if (score < 30) return 'Very conventional';
      if (score < 60) return 'Balanced';
      if (score < 80) return 'Distinctive';
      return 'Highly unique';
    } else {
      if (score < 30) return 'Industry outlier';
      if (score < 60) return 'Somewhat conventional';
      if (score < 80) return 'Highly conventional';
      return 'Industry standard';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center space-x-1 mb-4 border-b">
        <Button
          variant={activeTab === 'competitors' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'competitors' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('competitors')}
        >
          <Building className="h-4 w-4 mr-2" />
          Competitor Analysis
        </Button>

        <Button
          variant={activeTab === 'trends' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'trends' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Industry Trends
        </Button>

        <Button
          variant={activeTab === 'analysis' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'analysis' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('analysis')}
        >
          <BarChart className="h-4 w-4 mr-2" />
          Uniqueness Analysis
        </Button>
      </div>

      {/* Industry Context Header */}
      <div className="mb-4 flex items-center">
        <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Analysis for <span className="font-medium">{industryName}</span> industry
          {confidence < 1 && (
            <Badge variant="outline" className="ml-2 text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}
        </span>
      </div>

      {/* Competitor Analysis Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2 flex items-center">
            <Info className="h-4 w-4 inline-block mr-1" />
            Studying competitor logos helps create a design that's both recognizable and
            distinctive.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {competitorLogos.map((logo, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{logo.companyName}</h3>
                  {logo.similarityScore !== undefined && (
                    <Badge variant={logo.similarityScore > 70 ? 'destructive' : 'outline'}>
                      {logo.similarityScore}% similar
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-1 mb-2">{logo.logoDescription}</p>

                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <div className="flex mr-1">
                    {logo.dominantColors.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="h-4 w-4 rounded-full border border-gray-200"
                        style={{
                          backgroundColor: color,
                          marginLeft: colorIndex > 0 ? '-3px' : '0',
                          zIndex: logo.dominantColors.length - colorIndex,
                        }}
                        title={color}
                      />
                    ))}
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {logo.styleCategory}
                  </Badge>

                  {logo.visualElements.slice(0, 2).map((element, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {element}
                    </Badge>
                  ))}

                  {logo.visualElements.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{logo.visualElements.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 inline-block mr-1" />
            Current design trends in the {industryName} industry and their prevalence.
          </div>

          {industryTrends.map((trend, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{trend.name}</h3>
                <Badge
                  variant={trend.prevalence > 70 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {trend.prevalence}% prevalence
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-1 mb-2">{trend.description}</p>

              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Examples: </span>
                {trend.examples.join(', ')}
              </div>

              <div className="mt-2">
                <Progress value={trend.prevalence} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uniqueness Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <h3 className="font-medium mb-1">Uniqueness Score</h3>
              <div className="flex justify-between items-end mb-2">
                <span className={`text-2xl font-bold ${getScoreColor(uniquenessScore)}`}>
                  {uniquenessScore}/100
                </span>
                <span className="text-xs text-muted-foreground">
                  {getScoreStatus(uniquenessScore, true)}
                </span>
              </div>
              <Progress value={uniquenessScore} className="h-2 mb-2" />

              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>Blend In</span>
                <span>Stand Out</span>
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h3 className="font-medium mb-1">Industry Convention Score</h3>
              <div className="flex justify-between items-end mb-2">
                <span className={`text-2xl font-bold ${getScoreColor(conventionScore)}`}>
                  {conventionScore}/100
                </span>
                <span className="text-xs text-muted-foreground">
                  {getScoreStatus(conventionScore, false)}
                </span>
              </div>
              <Progress value={conventionScore} className="h-2 mb-2" />

              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>Unconventional</span>
                <span>Traditional</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <h3 className="font-medium mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1" />
              Balance Analysis
            </h3>
            <p className="text-sm text-muted-foreground">{balanceAnalysis}</p>
          </div>

          <div className="border rounded-lg p-3">
            <h3 className="font-medium mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {designRecommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
