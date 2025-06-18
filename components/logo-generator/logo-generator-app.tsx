'use client'

import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
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
import AnimationDownloadManager from './animation-download-manager';
import ProgressTracker from './progress-tracker';
import { SmartFollowUps } from './smart-follow-ups';
import { DesignCitations } from './design-citations';
import { IndustrySelector } from './industry-selector';
import { MockupPreviewSystem } from './mockup-preview-system';
import { AnimationSelector } from './animation-selector';
import { AnimationCustomizer } from './animation-customizer';
import { AnimationShowcase } from './animation-showcase';
import { AnimatedLogoDisplay } from './animated-logo-display';
import { UniquenessToggle } from './uniqueness-toggle';
import { UniquenessAnalysis } from './uniqueness-analysis';
import { 
  Message, 
  GenerationProgress, 
  GeneratedAssets, 
  MessageRole, 
  LogoGenerationState, 
  SVGLogo,            
  FileDownloadInfo,
  AnimationExportOptions
} from '@/lib/types'; 
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { H1, H2, H3, H4, Paragraph, LargeText } from '@/components/ui/typography';

interface AppMessage extends Message {
  type?: MessageRole;
  progress?: GenerationProgress;
  assets?: GeneratedAssets & { 
    brandName?: string;
    primaryLogoSVG?: SVGLogo; 
    individualFiles?: FileDownloadInfo[]; 
    zipPackageUrl?: string; 
  };
  files?: File[];
}

// Type for progress data from the hook, aligning with LogoGenerationState
type HookProgressData = Partial<LogoGenerationState>;

// Create Logo Generator Context
interface LogoGeneratorContextType {
  messages: AppMessage[];
  isGenerating: boolean;
  progress: GenerationProgress | null;
  preview: string | null;
  assets: GeneratedAssets | null;
  error: Error | null;
  handleSubmit: (content: string, files?: File[]) => Promise<void>;
  handleSuggestionSelect: (prompt: string) => void;
  handleRetry: () => void;
  handleReset: () => void;
  handleExportAnimation: (format: string, options?: AnimationExportOptions) => Promise<void>;
  detectedIndustry: string;
  selectedIndustry: string;
  setSelectedIndustry: (industry: string) => void;
  includeAnimations: boolean;
  setIncludeAnimations: (include: boolean) => void;
  selectedAnimationOptions: any;
  setSelectedAnimationOptions: (options: any) => void;
  includeUniquenessAnalysis: boolean;
  setIncludeUniquenessAnalysis: (include: boolean) => void;
  progressForTracker: {
    stages: any[];
    currentStageId: string | null;
    overallProgress: number;
    estimatedTimeRemaining: number | null;
  } | null;
}

const LogoGeneratorContext = createContext<LogoGeneratorContextType | null>(null);

// Hook to use Logo Generator Context
export const useLogoGeneratorContext = () => {
  const context = useContext(LogoGeneratorContext);
  if (!context) {
    throw new Error('useLogoGeneratorContext must be used within a LogoGeneratorProvider');
  }
  return context;
};

export function LogoGeneratorApp() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [detectedIndustry, setDetectedIndustry] = useState<string>('general');
  const [industryConfidence, setIndustryConfidence] = useState<number>(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('general');
  const [includeAnimations, setIncludeAnimations] = useState<boolean>(false);
  const [selectedAnimationOptions, setSelectedAnimationOptions] = useState<any>(null);
  const [includeUniquenessAnalysis, setIncludeUniquenessAnalysis] = useState<boolean>(false);
  
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
    // Reset industry detection for new generation
    setDetectedIndustry('general');
    setIndustryConfidence(0);
    
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
      // Include selected industry, animation options, and uniqueness analysis in the generation
      await generateLogo(content, files, {
        industry: selectedIndustry,
        includeAnimations: includeAnimations,
        animationOptions: selectedAnimationOptions,
        includeUniquenessAnalysis: includeUniquenessAnalysis
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  }, [generateLogo, toast, selectedIndustry, includeAnimations, selectedAnimationOptions, includeUniquenessAnalysis]);

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
  
  const handleExportAnimation = useCallback(async (format: string, options?: AnimationExportOptions) => {
    if (!hookAssets?.animatedSvg) {
      toast({
        title: "Animation Export Failed",
        description: "No animated logo available for export.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/export-animated-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg: hookAssets.animatedSvg,
          css: hookAssets.animationCss,
          js: hookAssets.animationJs,
          format,
          options
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to export animation');
      }
      
      // If successful, redirect to the download URL
      if (data.fileUrl) {
        window.location.href = data.fileUrl;
        
        toast({
          title: "Export Successful",
          description: `Your animated logo has been exported in ${format.toUpperCase()} format.`
        });
      }
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred during export",
        variant: "destructive"
      });
    }
  }, [hookAssets, toast]);

  const handleReset = useCallback(() => {
    reset();
    setMessages([]);
  }, [reset]);

  // Process hookProgress to ensure it has the right structure for the ProgressTracker
  const progressForTracker = useMemo(() => {
    if (!hookProgress) return null;
    
    // Ensure the progress data has the correct structure
    return {
      stages: Array.isArray(hookProgress.stages) ? hookProgress.stages : [],
      currentStageId: hookProgress.currentStage || null,
      overallProgress: typeof hookProgress.overallProgress === 'number' ? hookProgress.overallProgress : 0,
      estimatedTimeRemaining: typeof hookProgress.estimatedTimeRemaining === 'number' ? 
        hookProgress.estimatedTimeRemaining : null
    };
  }, [hookProgress]);

  // Create context value
  const contextValue: LogoGeneratorContextType = {
    messages,
    isGenerating,
    progress: hookProgress as GenerationProgress | null,
    preview,
    assets: hookAssets,
    error,
    handleSubmit,
    handleSuggestionSelect,
    handleRetry,
    handleReset,
    handleExportAnimation,
    detectedIndustry,
    selectedIndustry,
    setSelectedIndustry,
    includeAnimations,
    setIncludeAnimations,
    selectedAnimationOptions,
    setSelectedAnimationOptions,
    includeUniquenessAnalysis,
    setIncludeUniquenessAnalysis,
    progressForTracker
  };

  return (
    <ErrorBoundary>
      <LogoGeneratorContext.Provider value={contextValue}>
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
                <H1 className="text-center">AI Logo Generator</H1>
                <LargeText className="text-muted-foreground max-w-xl mx-auto">
                  Describe your brand and get a professionally designed logo in seconds. Add colors, style preferences, or upload reference images for inspiration.
                </LargeText>
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
            <>
              <div className="max-w-xl mx-auto mt-6 mb-4">
                <IndustrySelector
                  detectedIndustry={detectedIndustry}
                  detectedConfidence={industryConfidence}
                  onSelectIndustry={setSelectedIndustry}
                />
              </div>
              
              <div className="max-w-xl mx-auto mt-6 mb-4 space-y-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="includeAnimations"
                    checked={includeAnimations}
                    onChange={(e) => setIncludeAnimations(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="includeAnimations" className="text-sm font-medium">
                    Include animations for digital use
                  </label>
                </div>
                
                {includeAnimations && (
                  <div className="space-y-4">
                    <AnimationSelector
                      onSelectAnimation={setSelectedAnimationOptions}
                      className="mt-4"
                    />
                    
                    {/* Animation showcase button */}
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const showcaseElement = document.getElementById('animation-showcase');
                          if (showcaseElement) {
                            showcaseElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        Explore Animation Gallery
                      </Button>
                    </div>
                  </div>
                )}
                
                <UniquenessToggle
                  enabled={includeUniquenessAnalysis}
                  onToggle={setIncludeUniquenessAnalysis}
                  className="mt-4"
                />
              </div>
              <SuggestionChips
                suggestions={DEFAULT_LOGO_SUGGESTIONS}
                onSelectSuggestion={handleSuggestionSelect}
                className="mt-6"
              />
            </>
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
                    <H2>Your Logo Package</H2>
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
                      {hookAssets.animatedSvg && hookAssets.animationCss ? (
                        <div className="space-y-4">
                          <AnimatedLogoDisplay
                            svgCode={hookAssets.animatedSvg}
                            cssCode={hookAssets.animationCss}
                            jsCode={hookAssets.animationJs}
                            className="max-w-full"
                            showControls={true}
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            Animated SVG logo (for digital use)
                          </div>
                        </div>
                      ) : (
                        <LogoDisplay
                          svgCode={hookAssets.primaryLogoSVG?.svgCode || null}
                          variants={hookAssets.primaryLogoSVG ? [{ id: 'primary', name: 'Primary', svgCode: hookAssets.primaryLogoSVG.svgCode }] : []}
                          className="max-w-full"
                        />
                      )}
                    </div>
                    
                    {/* Download manager */}
                    <div>
                      <DownloadManager
                        files={hookAssets.individualFiles || []} 
                        packageUrl={hookAssets.zipPackageUrl}
                        brandName={hookAssets.brandName || "Your Brand"}
                        onDownloadFileAction={(fileId: string) => console.log('Download file:', fileId)}
                        onDownloadAllAction={() => console.log('Download all')}
                      />
                      
                      {/* Animation Download Manager - shown only when animation is available */}
                      {hookAssets.animatedSvg && (
                        <div className="mt-4">
                          <AnimationDownloadManager
                            animatedSvg={hookAssets.animatedSvg}
                            animationCss={hookAssets.animationCss}
                            animationJs={hookAssets.animationJs}
                            animationOptions={hookAssets.animationOptions}
                            brandName={hookAssets.brandName || "Your Brand"}
                            onExport={handleExportAnimation}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Smart follow-ups and refinements */}
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <SmartFollowUps 
                      onSelectFollowUp={handleSubmit}
                      brandName={hookAssets.brandName || "Your Brand"}
                      styleType="modern"
                      colorPalette="blue"
                    />
                    
                    <DesignCitations />
                  </div>
                  
                  {/* Uniqueness Analysis */}
                  {hookAssets.uniquenessAnalysis && (
                    <div className="mt-8 border-t pt-6">
                      <UniquenessAnalysis 
                        analysis={hookAssets.uniquenessAnalysis} 
                      />
                    </div>
                  )}
                  
                  {/* Mockup Preview System */}
                  <div className="mt-8 border-t pt-6">
                    <H3 className="mb-4">Visualize Your Logo</H3>
                    <MockupPreviewSystem 
                      logo={hookAssets.primaryLogoSVG?.svgCode || ''}
                      brandName={hookAssets.brandName || 'Your Brand'}
                      onDownload={(mockupId, format) => {
                        console.log(`Download mockup ${mockupId} in ${format} format`);
                        // You can implement additional download tracking here
                      }}
                    />
                  </div>
                  
                  {/* Animation Showcase Section */}
                  <div id="animation-showcase" className="mt-8 border-t pt-6">
                    <H3 className="mb-4">Animation Options</H3>
                    <AnimationShowcase
                      onSelectAnimation={(options) => {
                        setSelectedAnimationOptions(options);
                        toast({
                          title: "Animation Selected",
                          description: "Animation has been applied to your logo."
                        });
                      }}
                      svgPreview={hookAssets.primaryLogoSVG?.svgCode || null}
                    />
                  </div>
                  
                  {/* What's next? */}
                  <div className="mt-8 border-t pt-6">
                    <H3 className="mb-3">What's next?</H3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4 hover:bg-muted/30 transition-colors">
                        <H4 className="flex items-center m-0">
                          Download your assets
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </H4>
                        <Paragraph className="text-sm text-muted-foreground mt-1">
                          Get all logo variants in SVG, PNG, and ICO formats.
                        </Paragraph>
                      </Card>
                      
                      <Card className="p-4 hover:bg-muted/30 transition-colors">
                        <H4 className="flex items-center m-0">
                          Try variations
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </H4>
                        <Paragraph className="text-sm text-muted-foreground mt-1">
                          Explore different styles, colors, and layouts.
                        </Paragraph>
                      </Card>
                      
                      <Card className="p-4 hover:bg-muted/30 transition-colors">
                        <H4 className="flex items-center m-0">
                          Create brand guidelines
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </H4>
                        <Paragraph className="text-sm text-muted-foreground mt-1">
                          Get a complete brand package with usage guidelines.
                        </Paragraph>
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
      </LogoGeneratorContext.Provider>
    </ErrorBoundary>
  );
}

// Create a separate provider component for better code organization
export function LogoGeneratorProvider({ children }: { children: React.ReactNode }) {
  return <LogoGeneratorApp>{children}</LogoGeneratorApp>;
}