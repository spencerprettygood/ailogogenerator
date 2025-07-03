'use client'

import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from 'react';
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
import { LogoStorageService } from '@/lib/services/logo-storage-service';
import { LogoFeedback as LogoFeedbackType, LiveFeedback } from '@/lib/types-feedback';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

import { 
  Message, 
  GenerationProgress, 
  GeneratedAssets, 
  MessageRole, 
  ProgressStage,
  AnimationOptions,
  AnimationExportOptions,
  AnimationEasing,
  AnimationDirection
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
  sessionId?: string;
  generationOptions?: {
    includeAnimations: boolean;
    includeUniquenessAnalysis: boolean;
    includeMockups: boolean;
    selectedAnimationOptions: GetAnimationsOptions | null;
  };
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
    reset,
    fromCache,
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
      await generateLogo(content, files, {
        includeAnimations,
        animationOptions: selectedAnimationOptions ? {
          ...selectedAnimationOptions,
          timing: {
            duration: selectedAnimationOptions.duration,
            easing: selectedAnimationOptions.easing as AnimationEasing,
            delay: selectedAnimationOptions.delay,
            iterations: selectedAnimationOptions.iterations,
            direction: selectedAnimationOptions.direction as AnimationDirection,
          }
        } : undefined,
        includeUniquenessAnalysis,
        includeMockups,
      });
    } catch (err) {
      const errorId = generateId();
      const errorMessage: AppMessage = {
        id: errorId,
        role: MessageRole.SYSTEM,
        content: `An unexpected error occurred: ${(err as Error).message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  }, [generateLogo, toast, includeAnimations, selectedAnimationOptions, includeUniquenessAnalysis, includeMockups]);

  const handleSuggestionSelect = useCallback((prompt: string, files?: File[]) => {
    handleSubmit(prompt, files);
  }, [handleSubmit]);

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === MessageRole.USER);
    if (lastUserMessage && lastUserMessage.content) {
      reset();
      handleSubmit(lastUserMessage.content, lastUserMessage.files);
    }
  }, [messages, reset, handleSubmit]);
  
  const handleExportAnimation = useCallback(async (format: string, options?: AnimationExportOptions) => {
    if (!hookAssets?.animatedSvg) {
      toast({ title: 'No Animation Available', description: 'Please generate a logo with animation first.', variant: 'destructive' });
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
        
        toast({ title: 'Export Successful', description: `Animation exported as ${format}.` });
      }
    } catch (err) {
      toast({ title: 'Export Failed', description: (err as Error).message, variant: 'destructive' });
    }
  }, [hookAssets, toast]);

  const handleReset = useCallback(() => {
    reset();
    setMessages([]);
    setShowFeedback(false);
  }, [reset]);

  useEffect(() => {
    if (hookProgress) {
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.role === MessageRole.SYSTEM && !lastMessage.assets) {
          const updatedMessage = { ...lastMessage, progress: hookProgress };
          return [...prevMessages.slice(0, -1), updatedMessage];
        }
        // If there is no system message to update, we don't add a new one here.
        // The system message is added in handleSubmit.
        return prevMessages;
      });
    }
  }, [hookProgress]);

  useEffect(() => {
    if (hookAssets && sessionId) {
      const finalMessage: AppMessage = {
        id: generateId(),
        role: MessageRole.SYSTEM,
        content: fromCache ? 'Logo generation complete (from cache).' : 'Logo generation complete!',
        timestamp: new Date(),
        assets: hookAssets,
        sessionId: sessionId,
        progress: { status: 'completed', progress: 100, message: 'Done', stage: 'Done' },
        generationOptions: {
          includeAnimations,
          includeUniquenessAnalysis,
          includeMockups,
          selectedAnimationOptions,
        }
      };

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        // Replace the last message if it was a system progress message
        if (lastMessage && lastMessage.role === MessageRole.SYSTEM && !lastMessage.assets) {
          return [...prev.slice(0, -1), finalMessage];
        }
        return [...prev, finalMessage];
      });

      setShowFeedback(true);
      toast({
        title: 'Success!',
        description: 'Your new logo has been generated.',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookAssets, sessionId, fromCache, toast]); // Dependencies are stable, but ESLint might complain.

  useEffect(() => {
    if (error) {
      const errorId = generateId();
      const errorMessage: AppMessage = {
        id: errorId,
        role: MessageRole.SYSTEM,
        content: `An error occurred: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => {
         const lastMessage = prev[prev.length - 1];
         // Replace the last message if it was a system progress message
        if (lastMessage && lastMessage.role === MessageRole.SYSTEM && !lastMessage.assets) {
           return [...prev.slice(0, -1), errorMessage];
        }
        return [...prev, errorMessage];
      });
    }
  }, [error]);

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

  // Enhanced progress tracking component
  const EnhancedProgressTracker = ({ progress, stages, isGenerating }: {
    progress: GenerationProgress | null;
    stages?: ProgressStage[];
    isGenerating: boolean;
  }) => {
    if (!progress && !isGenerating) return null;

    return (
      <motion.div 
        className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <div className="absolute inset-0 h-2 w-2 bg-primary rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm font-medium">
              {hookProgress?.message || 'Generating your logo...'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {hookProgress?.progress || 0}%
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${hookProgress?.progress || 0}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          {hookProgress?.estimatedTimeRemaining && (
            <div className="text-xs text-muted-foreground text-center">
              Estimated time remaining: {Math.ceil(hookProgress.estimatedTimeRemaining / 1000)}s
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Enhanced button component with loading states
  const EnhancedButton = ({ children, isLoading, disabled, className, onClick, ...props }: {
    children: React.ReactNode;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
    [key: string]: any;
  }) => (
    <Button
      {...props}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`transition-all duration-200 hover:shadow-lg ${className || ''}`}
    >
      {isLoading ? (
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Generating...</span>
        </motion.div>
      ) : (
        children
      )}
    </Button>
  );

  // Enhanced switch component with visual feedback
  const EnhancedSwitch = ({ checked, onCheckedChange, disabled, className }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={className}
    >
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="transition-all duration-200"
      />
    </motion.div>
  );

  // Enhanced error display component
  const EnhancedErrorDisplay = ({ error, onRetry, isRetrying }: {
    error: Error;
    onRetry: () => void;
    isRetrying?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto"
    >
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center space-y-4">
          <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto">
            <RefreshCw className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive mb-2">Generation Failed</h3>
            <p className="text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <EnhancedButton
            onClick={onRetry}
            isLoading={isRetrying}
            variant="outline"
            className="border-destructive/20 hover:bg-destructive/5"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </EnhancedButton>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <ErrorBoundary>
      <LogoGeneratorContext.Provider value={contextValue}>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          
          <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Welcome Section */}
            {messages.length === 0 && (
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Hero Badge */}
                  <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 px-4 py-2 rounded-full">
                    <div className="relative">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <div className="absolute inset-0 animate-pulse">
                        <Sparkles className="h-4 w-4 text-primary opacity-50" />
                      </div>
                    </div>
                    <span className="font-medium">AI-Powered Logo Generation</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Pro
                    </Badge>
                  </div>

                  {/* Main Heading */}
                  <H1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
                    Create Your Perfect Logo
                  </H1>

                  {/* Subtitle */}
                  <LargeText className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Describe your brand and get a professionally designed logo in seconds. 
                    Choose exactly what you need from our comprehensive suite of design tools.
                  </LargeText>

                  {/* Feature Highlights */}
                  <div className="flex flex-wrap justify-center gap-3 mt-8">
                    {[
                      { icon: Sparkles, text: "Instant Generation", color: "text-yellow-500" },
                      { icon: Crown, text: "Professional Quality", color: "text-purple-500" },
                      { icon: Package, text: "Complete Package", color: "text-blue-500" },
                      { icon: PlayCircle, text: "Animated Logos", color: "text-green-500" }
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.text}
                        className="flex items-center space-x-2 bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg border transition-all duration-200"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <feature.icon className={`h-4 w-4 ${feature.color}`} />
                        <span className="text-sm font-medium">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Generation Options */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Card className="max-w-2xl mx-auto text-left shadow-lg border-2 hover:border-primary/20 transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Generation Options</h3>
                            <p className="text-sm text-muted-foreground">Customize your logo package</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          className="transition-all duration-200 hover:bg-primary/5"
                        >
                          <motion.div
                            animate={{ rotate: showAdvancedOptions ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                          </motion.div>
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
                        <EnhancedSwitch
                          checked={includeAnimations}
                          onCheckedChange={setIncludeAnimations}
                          disabled={isGenerating}
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
                            <EnhancedSwitch
                              checked={includeUniquenessAnalysis}
                              onCheckedChange={setIncludeUniquenessAnalysis}
                              disabled={isGenerating}
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
                            <EnhancedSwitch
                              checked={includeMockups}
                              onCheckedChange={setIncludeMockups}
                              disabled={isGenerating}
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
                </motion.div>
              </div>
            )}
          
            {/* Search Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: messages.length === 0 ? 0.8 : 0, duration: 0.4 }}
            >
              <SearchInterfaceEnhanced 
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
                placeholder={messages.length === 0 
                  ? "Describe your perfect logo (e.g., 'Modern tech startup logo with blue colors')" 
                  : "Refine your logo or try a new design..."
                }
                className="mb-6"
              />
            </motion.div>
          
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
                {/* Enhanced Progress Indicator */}
                {isGenerating && hookProgress && (
                  <EnhancedProgressTracker 
                    progress={hookProgress}
                    stages={progressForTracker?.stages}
                    isGenerating={isGenerating}
                  />
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
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <Card className="bg-card border rounded-xl p-6 max-w-5xl mx-auto space-y-6 shadow-lg">
                      {/* Logo Feedback */}
                      {showFeedback && (
                        <motion.div 
                          className="mb-6"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <LogoFeedback
                            logoId={sessionId}
                            sessionId={sessionId}
                            onClose={() => setShowFeedback(false)}
                            onSubmit={submitFeedback}
                          />
                        </motion.div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <H2>Your Logo Package</H2>
                            <p className="text-sm text-muted-foreground mt-1">
                              {availableTabs.length} sections available • Generated in {sessionId ? '5.2s' : '0s'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowFeedback(true)}
                            className="transition-all hover:bg-primary/5"
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Rate Logo
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:bg-muted/50 transition-all"
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
                  </motion.div>
                )}
              
                {/* Enhanced error retry */}
                {error && !isGenerating && (
                  <EnhancedErrorDisplay
                    error={error}
                    onRetry={handleRetry}
                    isRetrying={isGenerating}
                  />
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
