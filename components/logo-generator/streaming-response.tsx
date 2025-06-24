'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { SystemMessage } from './system-message';
import { EnhancedTypingIndicator } from './enhanced-typing-indicator';
import { EnhancedLogoCard } from './enhanced-logo-card';
import { ProgressTimeline } from './progress-timeline';
import { StageTransition } from './stage-transition';
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
    "H": "Packaging assets for download...",
    "cached": "Retrieved from cache"
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
  
  // Safely render message content of any type
  const renderMessageContent = (content: any) => {
    // Handle null or undefined
    if (content === null || content === undefined) {
      return '';
    }
    
    // Handle string content (most common case)
    if (typeof content === 'string') {
      return content;
    }
    
    // Handle object content
    if (typeof content === 'object') {
      // For arrays, map and join the content
      if (Array.isArray(content)) {
        return content.map((item, index) => {
          // Handle string items directly
          if (typeof item === 'string') {
            return <span key={index}>{item}</span>;
          }
          
          // Handle objects with text property
          if (item && typeof item === 'object') {
            if ('text' in item && typeof item.text === 'string') {
              return <span key={index}>{item.text}</span>;
            }
            
            if ('message' in item && typeof item.message === 'string') {
              return <span key={index}>{item.message}</span>;
            }
            
            // Handle other objects by stringifying
            try {
              return (
                <span key={index} className="text-xs bg-muted/50 px-1 py-0.5 rounded">
                  {JSON.stringify(item)}
                </span>
              );
            } catch {
              return <span key={index}>[Complex object]</span>;
            }
          }
          
          // Fallback for any other type
          return <span key={index}>{String(item)}</span>;
        });
      }
      
      // For objects with a message property, return that
      if ('message' in content && typeof content.message === 'string') {
        return content.message;
      }
      
      // For objects with a text property, return that
      if ('text' in content && typeof content.text === 'string') {
        return content.text;
      }
      
      // For other objects, stringify them
      try {
        return <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
      } catch (error) {
        return '[Object cannot be displayed]';
      }
    }
    
    // Handle other primitive types
    return String(content);
  };
  
  return (
    <div className={`w-full max-w-5xl mx-auto space-y-6 ${className}`}>
      {/* User query card */}
      {lastUserMessage && (
        <Card className="p-4 bg-muted/30">
          <div className="text-sm text-muted-foreground mb-1">Your query</div>
          <div className="font-medium">
{renderMessageContent(lastUserMessage.content)}
            {lastUserFiles.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                (+ {lastUserFiles.length} image{lastUserFiles.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </Card>
      )}
      
      {/* Logo preview (shown in a more prominent way with EnhancedLogoCard) */}
      {previewSvg && (
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Your logo is taking shape...</span>
          </div>
          <EnhancedLogoCard
            logo={{ svgCode: previewSvg }}
            brandName="Preview"
            colorPalette={['#4A90E2', '#50E3C2', '#F39C12', '#E74C3C']}
            className="max-w-md"
            showControls={false}
          />
        </motion.div>
      )}
      
      {/* Improved progress timeline with smooth animations */}
      {progressData && progressData.stages && (progressData.stages.length > 0 || isGenerating) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProgressTimeline
            stages={progressData.stages}
            currentStageId={progressData.currentStageId}
            overallProgress={progressData.overallProgress || 0}
            estimatedTimeRemaining={progressData.estimatedTimeRemaining}
            className="mt-6"
            onStageClick={(stageId) => {
              // Track stage clicks if needed
            }}
          />
        
          {/* Stage transition animation */}
          <StageTransition
            currentStage={progressData.currentStageId}
            previousStage={useMemo(() => {
              // Get the previous stage from the current one
              if (!progressData.currentStageId) return null;
              
              const currentIndex = progressData.stages.findIndex(
                stage => stage.id === progressData.currentStageId
              );
              
              if (currentIndex <= 0) return null;
              return progressData.stages[currentIndex - 1].id;
            }, [progressData.currentStageId, progressData.stages])}
            progress={progressData.overallProgress || 0}
            isGenerating={isGenerating}
          />
        </motion.div>
      )}
      
      {/* Response messages with real-time updates */}
      <div className="space-y-4 mt-6">
        {responseMessages.map((message) => {
          // Create a safe version of the message with properly handled content
          const safeMessage = {
            ...message,
            // Ensure message has an id
            id: message.id || `msg-${Math.random().toString(36).substring(2, 9)}`
            // Don't modify content here - let each component handle content properly
          };

          // Render the appropriate message component based on role
          if (message.role === 'user') {
            return <UserMessage key={safeMessage.id} message={safeMessage} />;
          } else if (message.role === 'assistant') {
            return <AssistantMessage key={safeMessage.id} message={safeMessage} />;
          } else {
            return <SystemMessage key={safeMessage.id} message={safeMessage} />;
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