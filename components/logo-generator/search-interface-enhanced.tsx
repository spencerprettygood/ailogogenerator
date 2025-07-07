'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, FileImage, X } from 'lucide-react';
import { FileUpload as FileUploadUnified } from './file-upload-unified';

// Common logo design terms for autocomplete
const LOGO_DESIGN_TERMS = [
  'modern',
  'minimalist',
  'bold',
  'colorful',
  'geometric',
  'elegant',
  'vintage',
  'abstract',
  'professional',
  'playful',
  'tech',
  'organic',
  'luxury',
  'creative',
  'corporate',
  'clean',
  'simple',
  'sophisticated',
  'rustic',
  'futuristic',
  'hand-drawn',
  'retro',
  'dynamic',
  'flat',
  '3D',
  'monogram',
  'wordmark',
  'icon',
  'emblem',
  'mascot',
  'blue',
  'green',
  'red',
  'purple',
  'orange',
  'black',
  'white',
  'yellow',
  'teal',
  'pink',
  'gradient',
  'monochrome',
  'pastel',
  'neon',
  'earthy',
];

// Industry categories
const INDUSTRIES = [
  'tech startup',
  'restaurant',
  'coffee shop',
  'fitness',
  'healthcare',
  'education',
  'real estate',
  'finance',
  'e-commerce',
  'travel',
  'beauty',
  'fashion',
  'gaming',
  'sports',
  'entertainment',
  'consulting',
  'legal',
  'art',
  'music',
  'photography',
];

interface SearchInterfaceProps {
  onSubmit: (prompt: string, files?: File[]) => void;
  isGenerating: boolean;
  className?: string;
  placeholder?: string;
}

export function SearchInterfaceEnhanced({
  onSubmit,
  isGenerating,
  className = '',
  placeholder = 'Describe your perfect logo...',
}: SearchInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current && !isGenerating) {
      inputRef.current.focus();
    }
  }, [isGenerating]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      // Auto-complete with first suggestion
      const lastWord = prompt.split(' ').pop() || '';
      const suggestion = suggestions[0];
      const newPrompt = prompt.slice(0, prompt.length - lastWord.length) + suggestion;
      setPrompt(newPrompt);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || files.length > 0) {
      onSubmit(prompt, files);
      setPrompt('');
      setFiles([]);
      setShowFileUpload(false);
      setShowSuggestions(false);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setShowFileUpload(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrompt(value);

    // Generate suggestions based on input
    if (value.trim().length > 2) {
      const words = value.toLowerCase().split(' ');
      const lastWord = words[words.length - 1];

      // If the last word has at least 2 characters, show suggestions
      if (lastWord && lastWord.length >= 2) {
        const termSuggestions = LOGO_DESIGN_TERMS.filter(
          term => term.toLowerCase().startsWith(lastWord) && term.toLowerCase() !== lastWord
        );

        const industrySuggestions = INDUSTRIES.filter(
          industry =>
            industry.toLowerCase().includes(lastWord) &&
            !value.toLowerCase().includes(industry.toLowerCase())
        );

        // Combine and limit suggestions
        const combinedSuggestions = [...termSuggestions, ...industrySuggestions].slice(0, 5);

        if (combinedSuggestions.length > 0) {
          setSuggestions(combinedSuggestions);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const words = prompt.split(' ');
    words.pop(); // Remove the last word

    // If the suggestion is a full industry, add it as a new term
    if (INDUSTRIES.includes(suggestion)) {
      setPrompt(`${words.join(' ')}${words.length > 0 ? ' ' : ''}${suggestion}`);
    } else {
      // Otherwise complete the last word
      setPrompt(`${words.join(' ')}${words.length > 0 ? ' ' : ''}${suggestion}`);
    }

    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const canSubmit = (prompt.trim() || files.length > 0) && !isGenerating;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="rounded-xl border bg-card shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative p-2">
            <Input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              className="pr-20 py-6 text-lg bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isGenerating}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />

            {prompt && !isGenerating && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={() => {
                  setPrompt('');
                  inputRef.current?.focus();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isGenerating}
              >
                <FileImage className="h-4 w-4" />
              </Button>

              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!canSubmit}
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full mt-1 z-10 bg-card border rounded-lg shadow-lg overflow-hidden"
              >
                <ul className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {showFileUpload && (
            <div className="px-4 pb-3">
              <FileUploadUnified
                onFilesChange={handleFilesChange}
                maxFiles={3}
                maxFileSizeMb={10}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
            </div>
          )}

          {files.length > 0 && (
            <div className="px-4 pb-3 text-sm text-muted-foreground">
              {files.length} image{files.length !== 1 ? 's' : ''} selected
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          {!isGenerating && prompt.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to generate
                •<kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Tab</kbd> to
                auto-complete •<kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Esc</kbd>{' '}
                to close suggestions
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
