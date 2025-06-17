'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw, Palette, Layout, Type, Download } from 'lucide-react';

interface FollowUpSuggestion {
  id: string;
  text: string;
  prompt: string;
  icon: React.ReactNode;
  category: 'style' | 'colors' | 'layout' | 'typography' | 'export';
}

interface SmartFollowUpsProps {
  onSelectFollowUp: (prompt: string) => void;
  brandName?: string;
  styleType?: string;
  colorPalette?: string;
  className?: string;
}

export function SmartFollowUps({
  onSelectFollowUp,
  brandName = 'Your brand',
  styleType = 'modern',
  colorPalette = 'blue',
  className = '',
}: SmartFollowUpsProps) {
  // Generate follow-up suggestions based on the current logo
  const generateSuggestions = (): FollowUpSuggestion[] => {
    return [
      {
        id: 'more-modern',
        text: 'Make it more modern',
        prompt: `Redesign the logo for ${brandName} with an ultra-modern aesthetic. Use cleaner lines, more minimalist elements, and a contemporary feel.`,
        icon: <Sparkles className="h-4 w-4" />,
        category: 'style'
      },
      {
        id: 'more-colorful',
        text: 'Try a different color palette',
        prompt: `Redesign the logo for ${brandName} with a different color palette. Instead of ${colorPalette}, use complementary colors that maintain the brand identity but provide a fresh look.`,
        icon: <Palette className="h-4 w-4" />,
        category: 'colors'
      },
      {
        id: 'different-layout',
        text: 'Alternative layout',
        prompt: `Redesign the logo for ${brandName} with a different layout arrangement. Keep the style and colors similar, but explore alternative compositions and element arrangements.`,
        icon: <Layout className="h-4 w-4" />,
        category: 'layout'
      },
      {
        id: 'typography-focus',
        text: 'Focus on typography',
        prompt: `Redesign the logo for ${brandName} with more emphasis on typography. Create a sophisticated wordmark that captures the brand essence with minimal graphic elements.`,
        icon: <Type className="h-4 w-4" />,
        category: 'typography'
      },
      {
        id: 'simplify',
        text: 'Simplify the design',
        prompt: `Simplify the logo for ${brandName}. Reduce complexity while maintaining brand recognition, making it more versatile for different applications and sizes.`,
        icon: <RefreshCw className="h-4 w-4" />,
        category: 'style'
      },
    ];
  };

  const suggestions = generateSuggestions();
  
  // Group suggestions by category
  const groupedSuggestions: Record<string, FollowUpSuggestion[]> = {
    style: suggestions.filter(s => s.category === 'style'),
    colors: suggestions.filter(s => s.category === 'colors'),
    layout: suggestions.filter(s => s.category === 'layout'),
    typography: suggestions.filter(s => s.category === 'typography'),
    export: suggestions.filter(s => s.category === 'export'),
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-3 flex items-center">
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        <span className="font-medium">Refine your logo</span>
      </div>
      
      <div className="space-y-4">
        {/* Style refinements */}
        <div>
          <h3 className="text-sm font-medium mb-2">Style</h3>
          <div className="flex flex-wrap gap-2">
            {groupedSuggestions.style.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onSelectFollowUp(suggestion.prompt)}
              >
                {suggestion.icon}
                <span className="ml-1">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Color refinements */}
        <div>
          <h3 className="text-sm font-medium mb-2">Colors</h3>
          <div className="flex flex-wrap gap-2">
            {groupedSuggestions.colors.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onSelectFollowUp(suggestion.prompt)}
              >
                {suggestion.icon}
                <span className="ml-1">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Layout refinements */}
        <div>
          <h3 className="text-sm font-medium mb-2">Layout</h3>
          <div className="flex flex-wrap gap-2">
            {groupedSuggestions.layout.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onSelectFollowUp(suggestion.prompt)}
              >
                {suggestion.icon}
                <span className="ml-1">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Typography refinements */}
        <div>
          <h3 className="text-sm font-medium mb-2">Typography</h3>
          <div className="flex flex-wrap gap-2">
            {groupedSuggestions.typography.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onSelectFollowUp(suggestion.prompt)}
              >
                {suggestion.icon}
                <span className="ml-1">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}