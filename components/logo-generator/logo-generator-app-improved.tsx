'use client'

import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// import { Separator } from '@/components/ui/separator';
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
import { UniquenessAnalysis } from './uniqueness-analysis';
import { AnimatedLogoDisplay } from './animated-logo-display';
import { MockupPreviewSystem } from './mockup-preview-system';
import { LogoFeedback, LiveFeedbackButton } from '@/components/feedback';
import { FeedbackService } from '@/lib/services/feedback-service';
import { LogoFeedback as LogoFeedbackType, LiveFeedback } from '@/lib/types-feedback';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { 
  Message, 
  GenerationProgress, 
  GeneratedAssets, 
  MessageRole, 
  ProgressStage,
  AnimationOptions,
  AnimationExportOptions
} from '@/lib/types'; 
import { 
  RefreshCw, 
  Sparkles, 
  PlayCircle, 
  Search, 
  Package, 
  Crown,
  Settings,
  Download,
  Info
} from 'lucide-react';
import { H1, H2, Paragraph, LargeText } from '@/components/ui/typography';

// Type definition for animation options
interface GetAnimationsOptions extends Omit<AnimationOptions, 'timing'> {
  duration: number;
  easing: string;
  delay: number;
  iterations: number;
  direction: string;
  [key: string]: any;
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
  includeMockups: boolean;
  setIncludeMockups: (include: boolean) => void;
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

export const useLogoGeneratorContext = () => {
  const context = useContext(LogoGeneratorContext);
  if (!context) {
    throw new Error('useLogoGeneratorContext must be used within a LogoGeneratorProvider');
  }
  return context;
};

export function LogoGeneratorApp() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [includeAnimations, setIncludeAnimations] = useState<boolean>(false);
  const [selectedAnimationOptions, setSelectedAnimationOptions] = useState<GetAnimationsOptions | null>(null);
  const [includeUniquenessAnalysis, setIncludeUniquenessAnalysis] = useState<boolean>(false);
  const [includeMockups, setIncludeMockups] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  
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
            easing,
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
        // Note: includeMockups would be added when backend supports it
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  }, [generateLogo, toast, includeAnimations, selectedAnimationOptions, includeUniquenessAnalysis, includeMockups]);

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
    if (lastUserMessage && lastUserMessage.content) {
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
  }, [reset]);

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
    includeMockups,
    setIncludeMockups,
    progressForTracker,
    showFeedback,
    setShowFeedback,
    submitFeedback,
    submitIssueFeedback
  };

  // Calculate available tabs based on generated assets
  const availableTabs = useMemo(() => {
    const tabs = ['logo', 'download'];
    if (hookAssets?.animatedSvg) tabs.splice(1, 0, 'animation');
    if (hookAssets?.mockups && hookAssets.mockups.length > 0) tabs.splice(-1, 0, 'mockups');
    if (hookAssets?.uniquenessAnalysis) tabs.splice(-1, 0, 'uniqueness');
    return tabs;
  }, [hookAssets]);

  return (
    <ErrorBoundary>
      <LogoGeneratorContext.Provider value={contextValue}>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          
          <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Welcome Section */}
            {messages.length === 0 && (
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <Sparkles className="h-4 w-4" />
                    <span>AI-Powered Logo Generation</span>
                  </div>
                  <H1 className="text-4xl lg:text-5xl font-bold">
                    Create Your Perfect Logo
                  </H1>
                  <LargeText className="text-muted-foreground max-w-2xl mx-auto">
                    Describe your brand and get a professionally designed logo in seconds. 
                    Choose what you need and we'll generate exactly that.
                  </LargeText>
                </div>

                {/* Generation Options */}
                <Card className="max-w-2xl mx-auto text-left">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Generation Options</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Options */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <PlayCircle className="h-5 w-5 text-primary" />
                          <div>
                            <Label className="text-base font-medium">Animations</Label>
                            <p className="text-sm text-muted-foreground">
                              Add motion effects for digital use
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={includeAnimations}
                          onCheckedChange={setIncludeAnimations}
                        />
                      </div>

                      {includeAnimations && (
                        <div className="ml-8 pl-4 border-l-2 border-muted">
                          <AnimationSelector
                            onSelectAnimation={(options) => {
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

                    {showAdvancedOptions && (
                      <>
                        <div className="border-t my-4" />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Search className="h-5 w-5 text-primary" />
                              <div>
                                <Label className="text-base font-medium">Uniqueness Analysis</Label>
                                <p className="text-sm text-muted-foreground">
                                  Compare against industry competitors
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={includeUniquenessAnalysis}
                              onCheckedChange={setIncludeUniquenessAnalysis}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Package className="h-5 w-5 text-primary" />
                              <div>
                                <Label className="text-base font-medium">Mockups</Label>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm text-muted-foreground">
                                    See your logo in real contexts
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    Beta
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={includeMockups}
                              onCheckedChange={setIncludeMockups}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-start space-x-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Smart Generation</p>
                        <p>We only generate the assets you select, saving time and resources. 
                        You can always add more features after generation.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          
            {/* Search Interface */}
            <SearchInterfaceEnhanced 
              onSubmit={handleSubmit}
              isGenerating={isGenerating}
              placeholder={messages.length === 0 
                ? "Describe your perfect logo (e.g., 'Modern tech startup logo with blue colors')" 
                : "Refine your logo or try a new design..."
              }
              className="mb-6"
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
                      <div>
                        <H2>Your Logo Package</H2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {availableTabs.length} sections available
                        </p>
                      </div>
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
                      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
                        {availableTabs.includes('logo') && <TabsTrigger value="logo">Logo</TabsTrigger>}
                        {availableTabs.includes('animation') && <TabsTrigger value="animation">Animation</TabsTrigger>}
                        {availableTabs.includes('mockups') && <TabsTrigger value="mockups">Mockups</TabsTrigger>}
                        {availableTabs.includes('uniqueness') && <TabsTrigger value="uniqueness">Uniqueness</TabsTrigger>}
                        {availableTabs.includes('download') && <TabsTrigger value="download"><Download className="h-4 w-4 mr-2" />Download</TabsTrigger>}
                      </TabsList>
                      
                      <TabsContent value="logo" className="space-y-4">
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
                          />
                        </div>
                      </TabsContent>
                      
                      {hookAssets?.animatedSvg && (
                        <TabsContent value="animation" className="space-y-4">
                          <AnimatedLogoDisplay
                            svgCode={hookAssets.animatedSvg}
                            cssCode={hookAssets.animationCss}
                            jsCode={hookAssets.animationJs}
                            className="max-w-full bg-muted/30 rounded-lg p-6"
                            showControls={true}
                          />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                              Animated version for digital and web use
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
                        </TabsContent>
                      )}
                      
                      {hookAssets?.mockups && hookAssets.mockups.length > 0 && (
                        <TabsContent value="mockups" className="space-y-4">
                          <MockupPreviewSystem 
                            logo={hookAssets.primaryLogoSVG?.svgCode || ''}
                            brandName={hookAssets.brandName || 'Your Brand'}
                            onDownload={(mockupId, format) => {
                              console.log(`Download mockup ${mockupId} in ${format} format`);
                              toast({
                                title: "Mockup Downloaded",
                                description: `${mockupId} mockup downloaded in ${format} format`,
                              });
                            }}
                          />
                        </TabsContent>
                      )}
                      
                      {hookAssets?.uniquenessAnalysis && (
                        <TabsContent value="uniqueness" className="space-y-4">
                          <UniquenessAnalysis 
                            analysis={hookAssets.uniquenessAnalysis} 
                          />
                        </TabsContent>
                      )}
                      
                      <TabsContent value="download" className="space-y-4">
                        <DownloadManager
                          files={hookAssets.individualFiles || []} 
                          packageUrl={hookAssets.zipPackageUrl}
                          brandName={hookAssets.brandName || "Your Brand"}
                          onDownloadFileAction={(file) => {
                            console.log('Downloading file:', file.id);
                            toast({
                              title: "Download Started",
                              description: `Downloading ${file.name}`,
                            });
                          }}
                          onDownloadAllAction={() => {
                            console.log('Downloading all files');
                            toast({
                              title: "Package Download Started",
                              description: "Downloading complete logo package",
                            });
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </Card>
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

export function LogoGeneratorProvider() {
  return <LogoGeneratorApp />;
}
