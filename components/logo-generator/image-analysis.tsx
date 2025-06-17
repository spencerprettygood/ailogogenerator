'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

interface ImageAnalysisProps {
  file: File;
}

interface AnalysisResult {
  dominantColors: string[];
  brightness: 'light' | 'dark' | 'balanced';
  style: string[];
}

export function ImageAnalysis({ file }: ImageAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeImage(file).then(result => {
      setAnalysis(result);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [file]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm">Analyzing image...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Image Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {analysis.dominantColors.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Dominant Colors:</span>
            <div className="flex gap-1 mt-1">
              {analysis.dominantColors.map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
        
        <div>
          <span className="text-xs text-muted-foreground">Brightness:</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {analysis.brightness}
          </Badge>
        </div>

        {analysis.style.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Style:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.style.map((style, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple image analysis function
async function analyzeImage(file: File): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = 100;
      canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx?.getImageData(0, 0, 100, 100);
      const data = imageData?.data;

      if (!data) {
        resolve({ dominantColors: [], brightness: 'balanced', style: [] });
        return;
      }

      // Simple color analysis
      const colors: { [key: string]: number } = {};
      let totalBrightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;

        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colors[hex] = (colors[hex] || 0) + 1;
      }

      const avgBrightness = totalBrightness / (data.length / 4);
      const brightness = avgBrightness > 170 ? 'light' : avgBrightness < 85 ? 'dark' : 'balanced';

      const dominantColors = Object.entries(colors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color);

      // Simple style detection based on color patterns
      const style: string[] = [];
      if (dominantColors.length <= 2) style.push('minimalist');
      if (avgBrightness > 200) style.push('clean');
      if (avgBrightness < 100) style.push('bold');

      resolve({ dominantColors, brightness, style });
    };

    img.src = URL.createObjectURL(file);
  });
}
