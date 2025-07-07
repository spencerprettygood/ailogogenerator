'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { SystemMessage } from './system-message';
import { EnhancedTypingIndicator } from './enhanced-typing-indicator';
import { EnhancedLogoCard } from './enhanced-logo-card';
import { ProgressTimeline } from './progress-timeline';
import { StageTransition } from './stage-transition';
import { Sparkles } from 'lucide-react';

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
    A: 'Analyzing your brand requirements...',
    B: 'Creating design concepts...',
    C: 'Selecting the optimal design direction...',
    D: 'Generating your SVG logo...',
    E: 'Validating and optimizing logo...',
    F: 'Creating variants and formats...',
    G: 'Preparing brand guidelines...',
    H: 'Packaging assets for download...',
    cached: 'Retrieved from cache',
  });

  // ALL hooks must be called unconditionally at the top level
  const lastUserMessage = useMemo(
    () => [...messages].reverse().find(message => message.role === 'user'),
    [messages]
  );

  const lastUserFiles = useMemo(
    () => (lastUserMessage as Message & { files?: File[] })?.files || [],
    [lastUserMessage]
  );

  const responseMessages = useMemo(() => {
    if (!lastUserMessage) return messages;
    const lastUserMessageIndex = messages.findIndex(m => m.id === lastUserMessage.id);
    return messages.slice(lastUserMessageIndex + 1);
  }, [messages, lastUserMessage]);

  const previousStage = useMemo(() => {
    if (!progressData?.currentStageId || !progressData?.stages) return null;
    const currentIndex = progressData.stages.findIndex(
      stage => stage.id === progressData.currentStageId
    );
    if (currentIndex <= 0) return null;
    return progressData.stages[currentIndex - 1]?.id || null;
  }, [progressData]);

  const currentStage = useMemo(
    () => progressData?.currentStageId || null,
    [progressData?.currentStageId]
  );

  // Safely render message content
  const renderMessageContent = useCallback((content: any) => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      if ('message' in content && typeof content.message === 'string') {
        return content.message;
      }
      if ('text' in content && typeof content.text === 'string') {
        return content.text;
      }
    }
    return String(content);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // NOW we can do conditional rendering after all hooks are called
  if (messages.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <motion.div
      className={`w-full max-w-5xl mx-auto space-y-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      layout
    >
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

      {/* Logo preview */}
      {previewSvg && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex items-center justify-center mb-3"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="relative">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              <motion.div
                className="absolute inset-0"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
              </motion.div>
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Your logo is taking shape...
            </span>
          </motion.div>
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <EnhancedLogoCard
              logo={{ svgCode: previewSvg }}
              brandName="Preview"
              colorPalette={['#4A90E2', '#50E3C2', '#F39C12', '#E74C3C']}
              className="max-w-md shadow-lg border-2 border-primary/20"
              showControls={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>
      )}

      {/* Progress timeline */}
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
            onStageClick={stageId => {
              // Track stage clicks if needed
            }}
          />

          {/* Stage transition animation */}
          <StageTransition
            currentStage={progressData.currentStageId}
            previousStage={previousStage}
            progress={progressData.overallProgress || 0}
            isGenerating={isGenerating}
          />
        </motion.div>
      )}

      {/* Response messages */}
      <div className="space-y-4 mt-6">
        {responseMessages.map(message => {
          const safeMessage = {
            ...message,
            id: message.id || `msg-${Math.random().toString(36).substring(2, 9)}`,
          };

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
            message={stageHighlights[currentStage || ''] || 'Creating your perfect logo...'}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  );
}
