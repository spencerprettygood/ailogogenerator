'use client'

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/lib/hooks/use-toast";
import { useLogoGeneration } from "@/lib/hooks/use-logo-generation";
import { generateId } from 'ai';
import { Header } from './header';
import ErrorBoundary from './error-boundary';
import { SearchInterfaceEnhanced } from './search-interface-enhanced';
import { SuggestionChips, DEFAULT_LOGO_SUGGESTIONS } from './suggestion-chips';
import { StreamingResponse } from './streaming-response';
import LogoDisplay from './logo-display';
import DownloadManager from './download-manager';
import ProgressTracker from './progress-tracker';
import { SmartFollowUps } from './smart-follow-ups';
import { DesignCitations } from './design-citations';
import { 
  Message, 
  GenerationProgress, 
  GeneratedAssets, 
  MessageRole, 
  LogoGenerationState, 
  SVGLogo,            
  FileDownloadInfo    
} from '@/lib/types'; 
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

interface AppMessage extends Message {
  type?: MessageRole;
  progress?: GenerationProgress;
  assets?: GeneratedAssets & { 
    primaryLogoSVG?: SVGLogo; 
    individualFiles?: FileDownloadInfo[]; 
    zipPackageUrl?: string; 
  };
  files?: File[];
}

// Type for progress data from the hook, aligning with LogoGenerationState
type HookProgressData = Partial<LogoGenerationState>;

export function LogoGeneratorApp() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  // We don't need sidebarOpen state for Perplexity style
  
  const { toast } = useToast();
  const {
    generateLogo,
    isGenerating,
    progress: hookProgress,
    preview,
    assets: hookAssets,
    sessionId,
    error,
    reset
  } = useLogoGeneration();

  const handleSubmit = useCallback(async (content: string, files?: File[]) => {
    const userMessage: AppMessage = {
      id: generateId(),
      role: 'user',
      type: 'user',
      content,
      timestamp: new Date(),
      files
    };
    setMessages(prev => [...prev, userMessage]);

    const systemMessage: AppMessage = {
      id: generateId(),
      role: 'system',
      type: 'system',
      content: 'Starting logo generation...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);

    try {
      await generateLogo(content, files);
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  }, [generateLogo, toast]);

  const handleSuggestionSelect = useCallback((prompt: string) => {
    handleSubmit(prompt);
  }, [handleSubmit]);

  React.useEffect(() => {
    if (hookProgress) {
      const currentProgressData = hookProgress as GenerationProgress;

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.type === 'assistant' && lastMessage.progress) {
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, progress: currentProgressData, content: currentProgressData.message, role: 'assistant', type: 'assistant' }
              : msg
          );
        } else {
          return [...prev, {
            id: generateId(),
            role: 'assistant',
            type: 'assistant',
            content: currentProgressData.message,
            timestamp: new Date(),
            progress: currentProgressData
          }];
        }
      });
    }
  }, [hookProgress]);

  React.useEffect(() => {
    if (hookAssets && sessionId) {
      const completionMessage: AppMessage = {
        id: generateId(),
        role: 'assistant',
        type: 'assistant',
        content: '🎉 Your logo package is ready! You can preview it above and download all files below.',
        timestamp: new Date(),
        assets: hookAssets as AppMessage['assets']
      };
      setMessages(prev => [...prev, completionMessage]);

      toast({
        title: "Generation Complete!",
        description: "Your logo package is ready for download.",
      });
    }
  }, [hookAssets, sessionId, toast]);

  React.useEffect(() => {
    if (error) {
      const errorMessageContent = error.message || "An unknown error occurred.";
      const errorMessage: AppMessage = {
        id: generateId(),
        role: 'system',
        type: 'system',
        content: `Error: ${errorMessageContent}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [error]);

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (lastUserMessage && lastUserMessage.content) {
      reset();
      setMessages([lastUserMessage]); 
      handleSubmit(lastUserMessage.content, lastUserMessage.files);
    }
  }, [messages, reset, handleSubmit]);

  const handleReset = useCallback(() => {
    reset();
    setMessages([]);
  }, [reset]);

  // Cast hookProgress to HookProgressData for ProgressTracker props
  const progressForTracker = hookProgress as HookProgressData | undefined;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Welcome card - shown only when no messages */}
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">AI Logo Generator</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Describe your brand and get a professionally designed logo in seconds. Add colors, style preferences, or upload reference images for inspiration.
                </p>
              </div>
            </div>
          )}
          
          {/* Enhanced search input with autocomplete */}
          <SearchInterfaceEnhanced 
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
            placeholder="Describe your brand and logo requirements..."
          />
          
          {/* Suggestion chips - shown only when no messages */}
          {messages.length === 0 && (
            <SuggestionChips
              suggestions={DEFAULT_LOGO_SUGGESTIONS}
              onSelectSuggestion={handleSuggestionSelect}
              className="mt-6"
            />
          )}
          
          {/* Response area */}
          {messages.length > 0 && (
            <div className="space-y-8">
              <StreamingResponse 
                messages={messages.map(m => ({...m, role: m.role || m.type || 'system'}))}
                isGenerating={isGenerating}
                previewSvg={preview}
                progressData={progressForTracker}
              />
              
              {/* Results area */}
              {hookAssets && sessionId && (
                <div className="bg-card border rounded-xl p-6 max-w-5xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Logo Package</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={handleReset}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      New Logo
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Logo display */}
                    <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
                      <LogoDisplay
                        svgCode={hookAssets.primaryLogoSVG?.svgCode || null}
                        variants={hookAssets.primaryLogoSVG ? [{ id: 'primary', name: 'Primary', svgCode: hookAssets.primaryLogoSVG.svgCode }] : []}
                        className="max-w-full"
                      />
                    </div>
                    
                    {/* Download manager */}
                    <div>
                      <DownloadManager
                        files={hookAssets.individualFiles || []} 
                        packageUrl={hookAssets.zipPackageUrl}
                        brandName="Your Brand"
                        onDownloadFileAction={(fileId: string) => console.log('Download file:', fileId)}
                        onDownloadAllAction={() => console.log('Download all')}
                      />
                    </div>
                  </div>
                  
                  {/* Smart follow-ups and refinements */}
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <SmartFollowUps 
                      onSelectFollowUp={handleSubmit}
                      brandName="Your Brand"
                      styleType="modern"
                      colorPalette="blue"
                    />
                    
                    <DesignCitations />
                  </div>
                  
                  {/* What's next? */}
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">What's next?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4 hover:bg-muted/30 transition-colors">
                        <h4 className="font-medium flex items-center">
                          Download your assets
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get all logo variants in SVG, PNG, and ICO formats.
                        </p>
                      </Card>
                      
                      <Card className="p-4 hover:bg-muted/30 transition-colors">
                        <h4 className="font-medium flex items-center">
                          Try variations
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Explore different styles, colors, and layouts.
                        </p>
                      </Card>
                      
                      <Card className="p-4 hover:bg-muted/30 transition-colors">
                        <h4 className="font-medium flex items-center">
                          Create brand guidelines
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get a complete brand package with usage guidelines.
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error retry */}
              {error && !isGenerating && (
                <div className="flex justify-center">
                  <Button onClick={handleRetry} variant="outline" className="mx-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Generation
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
        
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}