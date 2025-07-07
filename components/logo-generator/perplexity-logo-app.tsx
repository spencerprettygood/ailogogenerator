'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/lib/hooks/use-toast';
import { useLogoGeneration } from '@/lib/hooks/use-logo-generation';
import { Header } from './header';
import ErrorBoundary from './error-boundary';
import { PerplexitySearch } from './perplexity-search';
import { SuggestionChips, DEFAULT_LOGO_SUGGESTIONS } from './suggestion-chips';
import { StreamingResponse } from './streaming-response';
import LogoDisplay from './logo-display';
import DownloadManager from './download-manager';
import ProgressTracker from './progress-tracker';
import { Message } from '@/lib/types';
import { H1, H2, H3, Paragraph, LargeText } from '@/components/ui/typography';

interface PerplexityLogoAppState {
  hasSearched: boolean;
  currentQuery: string;
  showWelcome: boolean;
  messages: Message[];
}

export function PerplexityLogoApp() {
  const [appState, setAppState] = useState<PerplexityLogoAppState>({
    hasSearched: false,
    currentQuery: '',
    showWelcome: true,
    messages: [],
  });

  const { toast } = useToast();
  const {
    generateLogo,
    isGenerating,
    progress,
    preview,
    assets,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sessionId,
    error,
    reset,
  } = useLogoGeneration();

  // Handle search submission
  const handleSearch = useCallback(
    async (prompt: string, files?: File[]) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      };

      setAppState(prev => ({
        ...prev,
        hasSearched: true,
        currentQuery: prompt,
        showWelcome: false,
        messages: [...prev.messages, userMessage],
      }));

      try {
        await generateLogo(prompt, files);
      } catch (err) {
        toast({
          title: 'Generation Failed',
          description: err instanceof Error ? err.message : 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    },
    [generateLogo, toast]
  );

  // Handle suggestion chip clicks
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSearch(suggestion);
    },
    [handleSearch]
  );

  // Handle reset to start over
  const handleReset = useCallback(() => {
    reset();
    setAppState({
      hasSearched: false,
      currentQuery: '',
      showWelcome: true,
      messages: [],
    });
  }, [reset]);

  // Show error toast when generation fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'Generation Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <AnimatePresence mode="wait">
            {appState.showWelcome && !appState.hasSearched ? (
              // Welcome Screen - Perplexity Style
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              >
                {/* Hero Section */}
                <div className="text-center space-y-4 mb-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6"
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <H1>Create Your Perfect Logo</H1>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <LargeText className="text-muted-foreground max-w-2xl">
                      Describe your brand vision and watch as AI crafts professional logos tailored
                      to your business
                    </LargeText>
                  </motion.div>
                </div>

                {/* Central Search Interface */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="w-full max-w-2xl"
                >
                  <PerplexitySearch
                    onSearch={handleSearch}
                    isGenerating={isGenerating}
                    placeholder="Describe your brand, industry, and style preferences..."
                    className="shadow-lg border-2 border-primary/20 focus-within:border-primary/40 transition-colors"
                  />
                </motion.div>

                {/* Suggestion Chips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="w-full max-w-3xl"
                >
                  <SuggestionChips
                    suggestions={DEFAULT_LOGO_SUGGESTIONS}
                    onSelectSuggestion={handleSuggestionClick}
                    className="justify-center"
                  />
                </motion.div>
              </motion.div>
            ) : (
              // Results Screen - Streaming Response
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Query Display */}
                <Card className="p-6 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <H3 className="mb-2">Your Request</H3>
                      <Paragraph className="text-muted-foreground">
                        {appState.currentQuery}
                      </Paragraph>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleReset} className="ml-4">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Logo
                    </Button>
                  </div>
                </Card>

                {/* Streaming Response */}
                <StreamingResponse
                  messages={appState.messages}
                  isGenerating={isGenerating}
                  previewSvg={preview}
                  progressData={
                    progress
                      ? {
                          stages: [],
                          currentStageId: progress.stage || null,
                          overallProgress: progress.progress || 0,
                          estimatedTimeRemaining: null,
                        }
                      : undefined
                  }
                />

                {/* Logo Display */}
                {assets && preview && (
                  <Card className="p-8">
                    <div className="text-center mb-6">
                      <H2 className="mb-2">Your Logo is Ready!</H2>
                      <Paragraph className="text-muted-foreground">
                        Professional logo package created with AI precision
                      </Paragraph>
                    </div>

                    <LogoDisplay svgContent={preview} variants={[]} className="mb-8" />

                    <DownloadManager
                      files={assets.individualFiles || []}
                      packageUrl={assets.zipPackageUrl}
                      brandName="Your Logo"
                      onDownloadFileAction={fileName => {
                        const file = assets.individualFiles?.find(f => f.name === fileName);
                        if (file) {
                          window.open(file.url, '_blank');
                        }
                      }}
                      onDownloadAllAction={() => {
                        if (assets.zipPackageUrl) {
                          window.open(assets.zipPackageUrl, '_blank');
                        }
                      }}
                    />
                  </Card>
                )}

                {/* Progress Tracker */}
                {progress && (
                  <Card className="p-6">
                    <ProgressTracker
                      stages={[]}
                      currentStageId={progress.stage || null}
                      overallProgress={progress.progress || 0}
                      estimatedRemainingTime={null}
                    />
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact Search Bar for Results View */}
          {appState.hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
            >
              <Card className="p-3 shadow-lg border-2 border-primary/20">
                <PerplexitySearch
                  onSearch={handleSearch}
                  isGenerating={isGenerating}
                  placeholder="Try another logo..."
                  className="min-w-[400px]"
                  compact
                />
              </Card>
            </motion.div>
          )}
        </main>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
