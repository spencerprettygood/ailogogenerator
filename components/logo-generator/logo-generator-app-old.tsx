'use client'

import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/lib/hooks/use-toast";
import { useLogoGeneration } from "@/lib/hooks/use-logo-generation";
import { generateId } from '@/lib/ai-utils';
import { Header } from './header';
import ErrorBoundary from './error-boundary';
import { SearchInterfaceEnhanced } from './search-interface-enhanced';
import { SuggestionChips, DEFAULT_LOGO_SUGGESTIONS } from './suggestion-chips';
import { StreamingResponse } from './streaming-response';
import LogoDisplay from './logo-display';
import DownloadManager from './download-manager';
import AnimationDownloadManager from './animation-download-manager';
import { AnimationSelector } from './animation-selector';
import { UniquenessToggle } from './uniqueness-toggle';
import { UniquenessAnalysis } from './uniqueness-analysis';
import { AnimatedLogoDisplay } from './animated-logo-display';
import { MockupPreviewSystem } from './mockup-preview-system';
import { LogoFeedback, LiveFeedbackButton } from '@/components/feedback';
import { FeedbackService } from '@/lib/services/feedback-service';
import { LogoFeedback as LogoFeedbackType, LiveFeedback } from '@/lib/types-feedback';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AnimationEasing } from '@/lib/animation/types';

import { 
  Message, 
  GenerationProgress, 
  GeneratedAssets, 
  MessageRole, 
  ProgressStage,
  AnimationOptions,
  AnimationExportOptions,
  FileDownloadInfo,
  SVGLogo,
} from '@/lib/types'; 
import { RefreshCw } from 'lucide-react';
import { H1, H2, Paragraph, LargeText } from '@/components/ui/typography';
import { Sparkles, PlayCircle, Search, Package, Crown } from 'lucide-react';

// Type definition for animation options
interface GetAnimationsOptions extends Omit<AnimationOptions, 'timing'> {
  duration: number;
  easing: string;
  delay: number;
  iterations: number;
  direction: string;
  [key: string]: any; // Allow additional properties
}

interface AppMessage extends Message {
  progress?: GenerationProgress;
  assets?: GeneratedAssets;
}

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
  includeAnimations: boolean;
  setIncludeAnimations: (include: boolean) => void;
  selectedAnimationOptions: GetAnimationsOptions | null;
  setSelectedAnimationOptions: (options: GetAnimationsOptions | null) => void;
  includeUniquenessAnalysis: boolean;
  setIncludeUniquenessAnalysis: (include: boolean) => void;
  progressForTracker: {
    stages: ProgressStage[];
    currentStageId: string | null;
    overallProgress: number;
    estimatedTimeRemaining: number | null;
  } | null | undefined;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
  submitFeedback: (feedback: LogoFeedbackType) => Promise<void>;
  submitIssueFeedback: (feedback: LiveFeedback) => Promise<void>;
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

const transformAssetsToFiles = (assets: GeneratedAssets | null): FileDownloadInfo[] => {
  if (!assets) return [];
  const files: FileDownloadInfo[] = [];

  // From primary SVG logo
  if (assets.primaryLogoSVG) {
    const logo = assets.primaryLogoSVG;
    files.push({
      id: logo.name || 'primary-logo-svg',
      name: logo.name ? `${logo.name}.svg` : 'primary-logo.svg',
      size: logo.svgCode.length,
      type: 'image/svg+xml',
      category: 'Logo',
      url: `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(logo.svgCode) : Buffer.from(logo.svgCode).toString('base64')}`,
      status: 'pending',
      isPrimary: true,
    });
  }

  // From other logos
  assets.logos?.forEach((logo, i) => {
    // Avoid duplicating primary if it's in the list
    if (logo.svgCode === assets.primaryLogoSVG?.svgCode) return;
    files.push({
      id: logo.name || `logo-svg-${i}`,
      name: logo.name ? `${logo.name}.svg` : `logo-variant-${i}.svg`,
      size: logo.svgCode.length,
      type: 'image/svg+xml',
      category: 'Logo Variant',
      url: `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(logo.svgCode) : Buffer.from(logo.svgCode).toString('base64')}`,
      status: 'pending',
    });
  });

  // From pngVersions (legacy)
  if (assets.pngVersions) {
    for (const [sizeKey, url] of Object.entries(assets.pngVersions)) {
      if (url && typeof url === 'string') {
        files.push({
          id: `logo-png-${sizeKey}`,
          name: `${assets.brandName || 'logo'}-${sizeKey}.png`,
          size: 0, // Size is unknown from URL
          type: 'image/png',
          category: 'Logo (Raster)',
          url: url,
          status: 'pending',
        });
      }
    }
  }

  // From individual files (preferred way for multiple formats)
  if (assets.individualFiles) {
    files.push(...assets.individualFiles.map(f => ({ ...f, status: 'pending' } as FileDownloadInfo)));
  }

  // From zip package
  if (assets.zipPackageUrl) {
    files.push({
      id: 'package-zip',
      name: `${assets.brandName || 'logo'}-package.zip`,
      size: 0, // Size is unknown from URL
      type: 'application/zip',
      category: 'Complete Package',
      url: assets.zipPackageUrl,
      status: 'pending',
      isPrimary: true, // Often the main download
    });
  }

  return files;
};

export function LogoGeneratorApp() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [includeAnimations, setIncludeAnimations] = useState<boolean>(false);
  const [selectedAnimationOptions, setSelectedAnimationOptions] = useState<GetAnimationsOptions | null>(null);
  const [includeUniquenessAnalysis, setIncludeUniquenessAnalysis] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  
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
      role: MessageRole.USER,
      content,
      timestamp: new Date(),
      files,
      id: generateId()
    };
    setMessages(prev => [...prev, userMessage]);

    const systemMessage: AppMessage = {
      role: MessageRole.SYSTEM,
      content: 'Starting logo generation...',
      timestamp: new Date(),
      id: generateId()
    };
    setMessages(prev => [...prev, systemMessage]);

    try {
      let animationOptionsForApi: AnimationOptions | undefined;
      if (includeAnimations && selectedAnimationOptions) {
        const { duration, easing, delay, iterations, direction, ...rest } = selectedAnimationOptions;
        animationOptionsForApi = {
          ...rest,
          timing: {
            duration,
            easing: easing as AnimationEasing,
            delay,
            iterations,
            direction: direction as 'normal' | 'reverse' | 'alternate' | 'alternate-reverse',
          }
        };
      }

      await generateLogo(content, files, {
        includeAnimations,
        animationOptions: animationOptionsForApi,
        includeUniquenessAnalysis
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  }, [generateLogo, toast, includeAnimations, selectedAnimationOptions, includeUniquenessAnalysis]);

  const handleSuggestionSelect = useCallback((prompt: string, files?: File[]) => {
    handleSubmit(prompt, files);
  }, [handleSubmit]);

  React.useEffect(() => {
    if (hookProgress) {
      const currentProgressData = hookProgress as GenerationProgress;

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === MessageRole.ASSISTANT && lastMessage.progress) {
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, progress: currentProgressData, content: currentProgressData.message || '', role: MessageRole.ASSISTANT }
              : msg
          );
        } else {
          return [...prev, {
            id: generateId(),
            role: MessageRole.ASSISTANT,
            content: currentProgressData.message || '',
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
        role: MessageRole.ASSISTANT,
        content: '🎉 Your logo package is ready! You can preview it above and download all files below.',
        timestamp: new Date(),
        assets: hookAssets
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
        role: MessageRole.SYSTEM,
        content: `Error: ${errorMessageContent}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [error]);

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === MessageRole.USER);
    if (lastUserMessage && typeof lastUserMessage.content === 'string') {
      reset();
      setMessages([lastUserMessage]); 
      handleSubmit(
        lastUserMessage.content,
        lastUserMessage.files
      );
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
    // Clear session storage
    sessionStorage.removeItem('logo-generator-assets');
    sessionStorage.removeItem('logo-generator-messages');
  }, [reset]);

  // Add session storage to persist generated assets
  useEffect(() => {
    // Load previous session data on component mount
    const savedAssets = sessionStorage.getItem('logo-generator-assets');
    const savedMessages = sessionStorage.getItem('logo-generator-messages');
    
    if (savedAssets && savedMessages) {
      try {
        const parsedAssets = JSON.parse(savedAssets);
        const parsedMessages = JSON.parse(savedMessages);
        
        // Only restore if we don't already have content
        if (messages.length === 0 && !hookAssets) {
          setMessages(parsedMessages);
          // Note: We can't directly set hookAssets as it comes from the hook
          // The actual restoration would need to be handled by the useLogoGeneration hook
        }
      } catch (error) {
        console.warn('Failed to restore session data:', error);
        // Clear corrupted data
        sessionStorage.removeItem('logo-generator-assets');
        sessionStorage.removeItem('logo-generator-messages');
      }
    }
  }, []);

  // Save to session storage when assets or messages change
  useEffect(() => {
    if (hookAssets) {
      sessionStorage.setItem('logo-generator-assets', JSON.stringify(hookAssets));
    }
  }, [hookAssets]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('logo-generator-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const progressForTracker = useMemo(() => {
    if (!hookProgress) return null;

    if ('stages' in hookProgress && Array.isArray(hookProgress.stages)) {
      return {
        stages: hookProgress.stages as ProgressStage[],
        currentStageId: ('currentStageId' in hookProgress && typeof hookProgress.currentStageId === 'string') 
          ? hookProgress.currentStageId 
          : null,
        overallProgress: hookProgress.progress ?? 0,
        estimatedTimeRemaining: typeof hookProgress.estimatedTimeRemaining === 'number'
          ? hookProgress.estimatedTimeRemaining
          : null
      };
    }

    return {
      stages: [{
        id: hookProgress.stage ?? 'A',
        label: hookProgress.message ?? 'Working...',
        status: hookProgress.progress === 100 ? 'completed' : (hookProgress.progress > 0 ? 'in_progress' : 'pending'),
        progress: hookProgress.progress ?? 0,
      }] as ProgressStage[],
      currentStageId: (typeof hookProgress.stage === 'string') ? hookProgress.stage : 'A',
      overallProgress: hookProgress.progress ?? 0,
      estimatedTimeRemaining: typeof hookProgress.estimatedTimeRemaining === 'number'
        ? hookProgress.estimatedTimeRemaining
        : null
    };
  }, [hookProgress]);

  const filesForManager = useMemo(() => transformAssetsToFiles(hookAssets), [hookAssets]);

  const submitFeedback = useCallback(async (feedback: LogoFeedbackType) => {
    try {
      await FeedbackService.submitLogoFeedback(feedback);
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!"
      });
    } catch (error) {
      toast({
        title: "Feedback Submission Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const submitIssueFeedback = useCallback(async (feedback: LiveFeedback) => {
    try {
      await FeedbackService.submitIssueFeedback(feedback);
      toast({
        title: "Issue Reported",
        description: "Thank you for reporting this issue!"
      });
    } catch (error) {
      toast({
        title: "Issue Report Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

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
    includeAnimations,
    setIncludeAnimations,
    selectedAnimationOptions,
    setSelectedAnimationOptions,
    includeUniquenessAnalysis,
    setIncludeUniquenessAnalysis,
    progressForTracker,
    showFeedback,
    setShowFeedback,
    submitFeedback,
    submitIssueFeedback
  };

  return (
    <ErrorBoundary>
      <LogoGeneratorContext.Provider value={contextValue}>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          
          <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Welcome card - shown only when no messages */}
          {messages.length === 0 && (
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full animate-ping" />
                  </div>
                </div>
                <H1 className="text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  AI Logo Generator
                </H1>
                <LargeText className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Create a professional logo in seconds with AI. Describe your brand, choose your style, 
                  and get a complete logo package with animations, guidelines, and multiple formats.
                </LargeText>
              </div>
              
              {/* Features showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">AI-Powered Design</h3>
                  <p className="text-sm text-muted-foreground">Advanced AI creates unique logos tailored to your brand</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                    <PlayCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Animated Logos</h3>
                  <p className="text-sm text-muted-foreground">Optional animations for digital platforms and presentations</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Complete Package</h3>
                  <p className="text-sm text-muted-foreground">Multiple formats, guidelines, and ready-to-use files</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Search Interface with Perplexity-inspired UI */}
          <SearchInterfaceEnhanced 
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
            placeholder="Describe your perfect logo..."
            className="mb-6"
          />

          {/* Feature Selection Panel - shown when user starts typing or has content */}
          {messages.length === 0 && (
            <Card className="max-w-3xl mx-auto mb-6 border-dashed border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <H2 className="text-lg">Customize Your Logo Package</H2>
                </div>
                <Paragraph className="text-sm text-muted-foreground">
                  Select which assets you'd like to generate along with your logo. This helps reduce processing time and API costs.
                </Paragraph>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Animation Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="h-4 w-4 text-primary" />
                        <span className="font-medium">Animated Logo</span>
                      </div>
                      <Switch
                        checked={includeAnimations}
                        onCheckedChange={setIncludeAnimations}
                      />
                    </div>
                    {includeAnimations && (
                      <div className="ml-6 space-y-2">
                        <AnimationSelector
                          onSelectAnimation={(options) => {
                            // Convert to flat structure expected by the app
                            const flatOptions: GetAnimationsOptions = {
                              type: options.type,
                              duration: options.timing.duration,
                              easing: String(options.timing.easing || 'ease'),
                              delay: options.timing.delay || 0,
                              iterations: options.timing.iterations || 1,
                              direction: String(options.timing.direction || 'normal')
                            };
                            setSelectedAnimationOptions(flatOptions);
                          }}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Uniqueness Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-primary" />
                        <span className="font-medium">Uniqueness Analysis</span>
                      </div>
                      <Switch
                        checked={includeUniquenessAnalysis}
                        onCheckedChange={setIncludeUniquenessAnalysis}
                      />
                    </div>
                    {includeUniquenessAnalysis && (
                      <p className="ml-6 text-xs text-muted-foreground">
                        Analyze your logo against industry competitors and design trends
                      </p>
                    )}
                  </div>

                  {/* Mockups - Coming Soon */}
                  <div className="space-y-3 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Mockups</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
                      </div>
                      <Switch disabled={true} />
                    </div>
                  </div>

                  {/* Premium Features - Coming Soon */}
                  <div className="space-y-3 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Brand Guidelines</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">Pro</span>
                      </div>
                      <Switch disabled={true} />
                    </div>
                  </div>
                </div>

                {/* Cost Estimate */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated processing time:</span>
                    <span className="font-medium">
                      {includeAnimations && includeUniquenessAnalysis ? '45-60s' : 
                       includeAnimations || includeUniquenessAnalysis ? '30-45s' : '15-30s'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Suggestion chips - shown only when no messages */}
          {messages.length === 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2">Try these examples</h3>
                <p className="text-sm text-muted-foreground">Click any example to get started, or describe your own brand</p>
              </div>
              <SuggestionChips
                suggestions={[
                  ...DEFAULT_LOGO_SUGGESTIONS,
                  // Add more specific examples
                  { 
                    id: 'tech-startup', 
                    text: "Tech startup with modern geometric design", 
                    prompt: "Create a modern, geometric logo for a technology startup. Use blue and gray colors with clean lines and a professional feel." 
                  },
                  { 
                    id: 'coffee-shop', 
                    text: "Organic coffee shop with warm colors", 
                    prompt: "Design a warm, organic logo for a local coffee shop. Use brown and green earth tones with a hand-drawn, artisanal feel." 
                  },
                  { 
                    id: 'fitness-brand', 
                    text: "Fitness brand with bold typography", 
                    prompt: "Create a bold, energetic logo for a fitness brand. Use strong typography with orange and black colors that convey strength and motivation." 
                  }
                ]}
                onSelectSuggestion={handleSuggestionSelect}
                className="mt-6"
              />
            </div>
          )}
          
          {/* Response area */}
          {messages.length > 0 && (
            <div className="space-y-8">
              {/* Progress indicator when generating */}
              {isGenerating && progressForTracker && (
                <Card className="max-w-4xl mx-auto">
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                          <Sparkles className="h-8 w-8 text-primary animate-spin" />
                          <div className="absolute inset-0 h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium">Generating Your Logo</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {progressForTracker.estimatedTimeRemaining 
                          ? `About ${Math.round(progressForTracker.estimatedTimeRemaining / 1000)}s remaining`
                          : 'This should take about 30-60 seconds'
                        }
                      </p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ inlineSize: `${progressForTracker.overallProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      {progressForTracker.overallProgress}% complete
                    </div>
                  </CardContent>
                </Card>
              )}

              <StreamingResponse 
                messages={messages.map(m => ({
                  ...m,
                  role: m.role,
                  content: m.content
                }))}
                isGenerating={isGenerating}
                previewSvg={preview}
                progressData={progressForTracker}
              />
              
              {/* Results area */}
              {hookAssets && sessionId && (
                <Card className="bg-card border rounded-xl p-6 max-w-5xl mx-auto space-y-6">
                  {/* Logo Feedback */}
                  {showFeedback && (
                    <div className="mb-6">
                      <LogoFeedback
                        logoId={sessionId}
                        sessionId={sessionId}
                        onClose={() => setShowFeedback(false)}
                        onSubmit={submitFeedback}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <H2>Your Logo Package</H2>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFeedback(true)}
                      >
                        Rate Logo
                      </Button>
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
                  </div>
                  
                  <Tabs defaultValue="logo" className="w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
                      <TabsTrigger value="logo" className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Logo</span>
                      </TabsTrigger>
                      {hookAssets?.animatedSvg && (
                        <TabsTrigger value="animation" className="flex items-center space-x-2">
                          <PlayCircle className="h-4 w-4" />
                          <span>Animation</span>
                        </TabsTrigger>
                      )}
                      {hookAssets?.mockups && hookAssets.mockups.length > 0 && (
                        <TabsTrigger value="mockups" className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Mockups</span>
                        </TabsTrigger>
                      )}
                      {hookAssets?.uniquenessAnalysis && (
                        <TabsTrigger value="uniqueness" className="flex items-center space-x-2">
                          <Search className="h-4 w-4" />
                          <span>Analysis</span>
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="downloads">
                        <RefreshCw className="h-4 w-4" />
                        <span>Download</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="logo" className="mt-6">
                      <div className="space-y-4">
                        <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[300px]">
                          <LogoDisplay
                            svgCode={hookAssets.primaryLogoSVG?.svgCode || undefined}
                            variants={hookAssets.primaryLogoSVG ? [{ 
                              id: 'primary', 
                              name: 'Primary', 
                              svgCode: hookAssets.primaryLogoSVG.svgCode, 
                              type: 'color' 
                            }] : []}
                            className="max-w-full"
                            title={hookAssets.brandName || "Your Logo"}
                            allowDownload={true}
                          />
                        </div>
                        {hookAssets.primaryLogoSVG && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                            <div className="p-3 bg-background border rounded-lg">
                              <div className="font-medium">Width</div>
                              <div className="text-muted-foreground">{hookAssets.primaryLogoSVG.inlineSize || 'Auto'}px</div>
                            </div>
                            <div className="p-3 bg-background border rounded-lg">
                              <div className="font-medium">Height</div>
                              <div className="text-muted-foreground">{hookAssets.primaryLogoSVG.blockSize || 'Auto'}px</div>
                            </div>
                            <div className="p-3 bg-background border rounded-lg">
                              <div className="font-medium">Colors</div>
                              <div className="text-muted-foreground">{hookAssets.primaryLogoSVG.colors ? Object.keys(hookAssets.primaryLogoSVG.colors).length : 0}</div>
                            </div>
                            <div className="p-3 bg-background border rounded-lg">
                              <div className="font-medium">Format</div>
                              <div className="text-muted-foreground">SVG</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    {hookAssets?.animatedSvg && (
                      <TabsContent value="animation" className="mt-6">
                        <div className="space-y-6">
                          <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[300px]">
                            <AnimatedLogoDisplay
                              svgCode={hookAssets.animatedSvg}
                              cssCode={hookAssets.animationCss}
                              jsCode={hookAssets.animationJs}
                              className="max-w-full"
                              showControls={true}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                              Animated SVG logo perfect for digital use. Compatible with websites, presentations, and digital media.
                            </p>
                            <AnimationDownloadManager
                              animatedSvg={hookAssets.animatedSvg}
                              animationCss={hookAssets.animationCss}
                              animationJs={hookAssets.animationJs}
                              animationOptions={hookAssets.animationOptions}
                              brandName={hookAssets.brandName || "Your Brand"}
                              onExport={handleExportAnimation}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    )}
                    {hookAssets?.mockups && hookAssets.mockups.length > 0 && (
                      <TabsContent value="mockups">
                        <div className="mt-4">
                          <MockupPreviewSystem 
                            logo={hookAssets.primaryLogoSVG?.svgCode || ''}
                            brandName={hookAssets.brandName || 'Your Brand'}
                            onDownload={(mockupId, format) => {
                              console.log(`Download mockup ${mockupId} in ${format} format`);
                            }}
                          />
                        </div>
                      </TabsContent>
                    )}
                    {hookAssets?.uniquenessAnalysis && (
                      <TabsContent value="uniqueness" className="mt-6">
                        <div className="space-y-4">
                          <div className="text-center mb-6">
                            <H2 className="text-xl mb-2">Logo Uniqueness Analysis</H2>
                            <Paragraph className="text-muted-foreground">
                              How your logo compares to industry standards and competitors
                            </Paragraph>
                          </div>
                          <UniquenessAnalysis 
                            analysis={hookAssets.uniquenessAnalysis}
                            onApplyRecommendation={(recommendation) => {
                              // Could trigger a logo refinement request
                              console.log('Apply recommendation:', recommendation);
                            }}
                          />
                        </div>
                      </TabsContent>
                    )}
                    <TabsContent value="downloads">
            <DownloadManager 
              files={filesForManager}
              packageUrl={hookAssets?.zipPackageUrl}
              onDownloadFileAction={(fileId: string) => {
                console.log('Downloading file:', fileId);
                // Implement actual download logic here
              }}
              onDownloadAllAction={() => {
                  if(hookAssets?.zipPackageUrl) {
                      window.open(hookAssets.zipPackageUrl, '_blank');
                  }
              }}
              brandName="YourBrand"
            />
          </TabsContent>
                  </Tabs>
                </Card>
              )}
              
              {/* Error handling with better UX */}
              {error && !isGenerating && (
                <Card className="max-w-3xl mx-auto border-destructive/20 bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 text-destructive" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-destructive">Generation Failed</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {error.message || "Something went wrong while generating your logo"}
                        </p>
                      </div>
                      <div className="flex justify-center space-x-3">
                        <Button onClick={handleRetry} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                        <Button onClick={handleReset} variant="ghost" size="sm">
                          Start Over
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
        
        {/* Live Feedback Button */}
        {sessionId && (
          <LiveFeedbackButton
            sessionId={sessionId}
            currentStage={hookProgress?.stage || undefined}
            onSubmit={submitIssueFeedback}
          />
        )}
        
        <Toaster />
      </div>
      </LogoGeneratorContext.Provider>
    </ErrorBoundary>
  );
}

// Create a separate provider component for better code organization
export function LogoGeneratorProvider() {
  return <LogoGeneratorApp />;
}