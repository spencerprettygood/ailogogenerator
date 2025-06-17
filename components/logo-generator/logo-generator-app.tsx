'use client'

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster } from '../ui/toaster';
import { ChatInterface } from './chat-interface'; // Corrected import to named
import ProgressTracker from './progress-tracker';
import LogoDisplay from './logo-display';
import DownloadManager from './download-manager';
import { Header } from './header';
import { ErrorBoundary } from './error-boundary';
import { useLogoGeneration } from '@/lib/hooks/use-logo-generation';
import { useToast } from '../../lib/hooks/use-toast';
import { 
  Message, 
  GenerationProgress, 
  GeneratedAssets, 
  MessageRole, 
  LogoGenerationState, // For progress.stages etc.
  SVGLogo,             // For assets.primaryLogoSVG
  FileDownloadInfo     // For assets.individualFiles
} from '@/lib/types'; 
import { generateId } from '@/lib/utils';
import { Sparkles, X } from 'lucide-react';

interface AppMessage extends Message {
  type?: MessageRole;
  progress?: GenerationProgress;
  assets?: GeneratedAssets & { 
    primaryLogoSVG?: SVGLogo; 
    individualFiles?: FileDownloadInfo[]; 
    zipPackageUrl?: string; 
  }; // Augmenting GeneratedAssets for app state
  files?: File[];
}

// Type for progress data from the hook, aligning with LogoGenerationState
type HookProgressData = Partial<LogoGenerationState>;

export function LogoGeneratorApp() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const [startTime, setStartTime] = useState<Date | null>(null); // Marked as unused, can be re-added if needed
  
  const { toast } = useToast();
  const {
    generateLogo,
    isGenerating,
    progress: hookProgress, // Renaming to avoid conflict with AppMessage.progress
    preview,
    assets: hookAssets, // Renaming to avoid conflict
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

    // setStartTime(new Date()); // Related to unused startTime
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

  React.useEffect(() => {
    if (hookProgress) {
      // Assuming hookProgress is of type GenerationProgress as defined in types.ts
      // If hookProgress is actually LogoGenerationState, adjust accordingly
      const currentProgressData = hookProgress as GenerationProgress; // Cast if necessary

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
        assets: hookAssets as AppMessage['assets'] // Cast to augmented type
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

  // Cast hookProgress to HookProgressData for ProgressTracker props
  const progressForTracker = hookProgress as HookProgressData | undefined;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 min-h-0">
              <ChatInterface
                onSendMessageAction={(messageContent: string, messageFiles?: File[]) => handleSubmit(messageContent, messageFiles)}
                messages={messages.map(m => ({...m, role: m.role || m.type || 'system'}))} 
                isGenerating={isGenerating}
                className="h-full"
              />
            </div>
          </div>

          <div className={`
            ${sidebarOpen ? 'w-96' : 'w-0'} 
            transition-all duration-300 overflow-hidden
            border-l bg-muted/20
            lg:relative absolute inset-y-0 right-0 z-10
          `}>
            {sidebarOpen && (
              <div className="h-full overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="lg:hidden flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <LogoDisplay
                    svgCode={preview || null} // Ensure it's string | null
                    variants={hookAssets?.primaryLogoSVG ? [{ id: 'primary', name: 'Primary', svgCode: hookAssets.primaryLogoSVG.svgCode }] : []}
                  />

                  {(isGenerating || progressForTracker) && (
                    <ProgressTracker
                      stages={progressForTracker?.stages || []} 
                      currentStageId={progressForTracker?.currentStageId || null}
                      overallProgress={progressForTracker?.overallProgress || 0}
                      estimatedRemainingTime={progressForTracker?.estimatedTimeRemaining || null}
                    />
                  )}
                  {/* Conditionally render retry button if there is an error */}
                  {error && !isGenerating && (
                     <Button onClick={handleRetry} variant="outline" className="w-full">
                       Retry Generation
                     </Button>
                  )}

                  {hookAssets && sessionId && (
                    <DownloadManager
                      files={hookAssets.individualFiles || []} 
                      packageUrl={hookAssets.zipPackageUrl}
                      brandName="Your Brand"
                      onDownloadFileAction={(fileId: string) => console.log('Download file:', fileId)}
                      onDownloadAllAction={() => console.log('Download all') }
                    />
                  )}

                  {!isGenerating && messages.length === 0 && (
                    <Card className="p-4">
                      <div className="text-center space-y-3">
                        <Sparkles className="h-8 w-8 mx-auto text-primary" />
                        <div>
                          <h3 className="font-medium">Ready to Create?</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Describe your logo requirements in the chat to get started.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-0"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
