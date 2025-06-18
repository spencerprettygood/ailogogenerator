'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { SystemMessage } from './system-message';
import { EnhancedTypingIndicator } from './enhanced-typing-indicator';
import LogoDisplay from './logo-display';
import ProgressTracker from './progress-tracker';
import { Info, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';

interface ProgressStage {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
}

interface StreamingResponseProps {
  messages: Message[];
  isGenerating: boolean;
  previewSvg?: string | null;
  progressData?: {
    stages: ProgressStage[];
    currentStageId: string | null;
    overallProgress: number;
    estimatedTimeRemaining: number | null;
  } | null;
  className?: string;
}

export function StreamingResponse({
  messages,
  isGenerating,
  previewSvg,
  progressData,
  className = '',
}: StreamingResponseProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStageInfo, setShowStageInfo] = useState<Record<string, boolean>>({});
  const [stageHighlights, setStageHighlights] = useState<Record<string, string>>({
    "A": "Analyzing your brand requirements...",
    "B": "Creating design concepts...",
    "C": "Selecting the optimal design direction...",
    "D": "Generating your SVG logo...",
    "E": "Validating and optimizing logo...",
    "F": "Creating variants and formats...",
    "G": "Preparing brand guidelines...",
    "H": "Packaging assets for download..."
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // If there are no messages, return nothing
  if (messages.length === 0) {
    return null;
  }
  
  // Get the last query message for display at the top
  const lastUserMessage = [...messages]
    .reverse()
    .find(message => message.role === 'user');
  // Support files property if present (for AppMessage compatibility)
  type MessageWithFiles = Message & { files?: File[] };
  const lastUserFiles = (lastUserMessage as MessageWithFiles)?.files || [];
  
  // Get all response messages after the last user message
  const responseMessages = messages.length > 0 && lastUserMessage 
    ? messages.filter((_, index) => 
        index > messages.findIndex(m => m.id === lastUserMessage.id)
      )
    : messages; // If there's no user message, show all messages
    
  // Get current stage info with safety checks
  const currentStage = progressData?.currentStageId || null;
  
  // Toggle stage info display
  const toggleStageInfo = (stageId: string) => {
    setShowStageInfo(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };
  
  // Get estimated completion time
  const formatTimeRemaining = (seconds: number | null) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    return `${Math.round(seconds / 60)} minute${Math.round(seconds / 60) !== 1 ? 's' : ''}`;
  };
  
  return (
    <div className={`w-full max-w-5xl mx-auto space-y-6 ${className}`}>
      {/* User query card */}
      {lastUserMessage && (
        <Card className="p-4 bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Your query</div>
          <div className="font-medium">
            {lastUserMessage.content}
            {lastUserFiles.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                (+ {lastUserFiles.length} image{lastUserFiles.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </Card>
      )}
      
      {/* Logo preview (shown in a more prominent way) */}
      {previewSvg && (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Your logo is taking shape...</span>
          </div>
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <LogoDisplay
              svgCode={previewSvg}
              variants={[]}
              className="max-w-md"
            />
          </div>
        </div>
      )}
      
      {/* Enhanced progress tracker with stages explanation */}
      {progressData && progressData.stages && (progressData.stages.length > 0 || isGenerating) && (
        <Card className="border overflow-hidden">
          {/* Compact progress view */}
          <div className="p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {progressData.estimatedTimeRemaining !== null 
                    ? `Estimated time: ${formatTimeRemaining(progressData.estimatedTimeRemaining)}`
                    : 'Generating your logo...'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    <span className="text-xs mr-1">Hide details</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span className="text-xs mr-1">Show details</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            
            {/* Overall progress bar */}
            <div className="w-full bg-muted rounded-full h-2.5 mb-2">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressData.overallProgress || 0}%` }}
              />
            </div>
            <div className="text-xs text-right text-muted-foreground">
              {Math.round(progressData.overallProgress || 0)}% complete
            </div>
          </div>
          
          {/* Detailed progress view */}
          {showDetails && (
            <div className="border-t p-4">
              <ProgressTracker
                stages={progressData.stages || []}
                currentStageId={progressData.currentStageId}
                overallProgress={progressData.overallProgress || 0}
                estimatedRemainingTime={progressData.estimatedTimeRemaining}
              />
              
              {/* Current stage explanation */}
              {currentStage && (
                <div className="mt-4 bg-muted/30 rounded-lg p-3">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStageInfo(currentStage)}
                  >
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium text-sm">
                        Stage {currentStage}: {stageHighlights[currentStage] || `Processing stage ${currentStage}`}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {showStageInfo[currentStage] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {showStageInfo[currentStage] && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {currentStage === "A" && (
                        <p>Analyzing your brand description to extract key design requirements including 
                          colors, style preferences, industry context, and target audience. This helps create 
                          a logo that perfectly matches your brand identity.</p>
                      )}
                      {currentStage === "B" && (
                        <p>Creating multiple design concepts based on your requirements. We&apos;re exploring 
                          different visual approaches, color schemes, and style directions to find the perfect
                          representation of your brand.</p>
                      )}
                      {currentStage === "C" && (
                        <p>Evaluating all design concepts against your requirements to select the most 
                          effective direction. We&apos;re analyzing each option for brand alignment, 
                          visual impact, and versatility.</p>
                      )}
                      {currentStage === "D" && (
                        <p>Creating your custom SVG logo with precision vector graphics. We&apos;re crafting 
                          every element with attention to detail, ensuring perfect shapes, 
                          proportions, and visual harmony.</p>
                      )}
                      {currentStage === "E" && (
                        <p>Optimizing your logo for performance and versatility. We&apos;re ensuring clean 
                          vector paths, proper scaling behavior, and technical quality for 
                          all usage scenarios.</p>
                      )}
                      {currentStage === "F" && (
                        <p>Creating alternative versions of your logo for different contexts - 
                          monochrome variants for single-color applications, simplified favicon
                          for web browsers, and multiple size formats.</p>
                      )}
                      {currentStage === "G" && (
                        <p>Developing comprehensive brand guidelines that document proper logo 
                          usage, color codes, spacing requirements, and implementation recommendations.</p>
                      )}
                      {currentStage === "H" && (
                        <p>Preparing all your assets for convenient download - organizing files, 
                          creating appropriate formats, and packaging everything into a complete 
                          brand asset bundle.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
      
      {/* Response messages with real-time updates */}
      <div className="space-y-4 mt-6">
        {responseMessages.map((message) => {
          if (message.role === 'user') {
            return <UserMessage key={message.id} message={message} />;
          } else if (message.role === 'assistant') {
            return <AssistantMessage key={message.id} message={message} />;
          } else {
            return <SystemMessage key={message.id} message={message} />;
          }
        })}
        
        {isGenerating && (
          <EnhancedTypingIndicator 
            stage={currentStage || undefined}
            message={stageHighlights[currentStage || ''] || "Creating your perfect logo..."}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}