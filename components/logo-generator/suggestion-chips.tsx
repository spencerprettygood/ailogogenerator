'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface Suggestion {
  id: string;
  text: string;
  prompt: string;
  icon?: React.ReactNode;
}

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (prompt: string) => void;
  className?: string;
}

export function SuggestionChips({
  suggestions,
  onSelectSuggestion,
  className = '',
}: SuggestionChipsProps) {
  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="mb-2 flex items-center">
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        <span className="text-sm font-medium">Try one of these</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            variant="outline"
            className="rounded-full text-sm py-1 h-auto"
            onClick={() => onSelectSuggestion(suggestion.prompt)}
          >
            {suggestion.icon && <span className="mr-1">{suggestion.icon}</span>}
            {suggestion.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Default suggestions for logo generation
export const DEFAULT_LOGO_SUGGESTIONS: Suggestion[] = [
  {
    id: 'tech-startup',
    text: 'Tech Startup Logo',
    prompt: 'Create a modern, minimalist logo for a tech startup named "Quantum Nexus" that specializes in AI solutions. Use blue and purple colors with a futuristic feel.',
  },
  {
    id: 'cafe',
    text: 'Coffee Shop Logo',
    prompt: 'Design a warm and inviting logo for an artisanal coffee shop called "Morning Brew" with earthy tones and a hand-crafted feel.',
  },
  {
    id: 'fitness',
    text: 'Fitness Brand Logo',
    prompt: 'Create an energetic logo for a fitness brand called "Peak Performance" that appeals to young professionals. Use dynamic shapes and bold colors.',
  },
  {
    id: 'eco-friendly',
    text: 'Eco-Friendly Logo',
    prompt: 'Design a nature-inspired logo for a sustainable product company called "GreenLife" that emphasizes environmental responsibility. Use green and earth tones.',
  },
  {
    id: 'luxury',
    text: 'Luxury Brand Logo',
    prompt: 'Create an elegant, sophisticated logo for a luxury fashion brand called "Lumière" with a timeless aesthetic. Use gold and black colors.',
  },
];