import React from 'react';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LogoPreview } from './logo-preview';

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  // Safely render message content of any type
  const renderContent = () => {
    // Handle string content (most common case)
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    // Handle array content
    if (Array.isArray(message.content)) {
      return (
        <>
          {message.content.map((item, index) => {
            // Handle string items
            if (typeof item === 'string') {
              return <span key={index}>{item}</span>;
            }
            
            // Handle items with text property
            if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
              return <span key={index}>{item.text}</span>;
            }
            
            // Handle other object items by stringifying them
            if (item && typeof item === 'object') {
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
          })}
        </>
      );
    }
    
    // Handle object content
    if (message.content && typeof message.content === 'object') {
      try {
        return <pre className="text-xs overflow-auto">{JSON.stringify(message.content, null, 2)}</pre>;
      } catch {
        return "[Complex object cannot be displayed]";
      }
    }
    
    // Fallback for any other type
    return String(message.content || '');
  };

  // Safely render progress data
  const renderProgress = () => {
    if (!message.progress) return null;
    
    // Extract progress information with type safety
    const stage = message.progress.stage ?? 'unknown';
    const progressMessage = message.progress.message ?? 'Processing...';
    const progressValue = message.progress.progress ?? 0;
    
    return (
      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Stage {stage}: {progressMessage}</span>
          <span>{progressValue}%</span>
        </div>
        <Progress value={progressValue} />
      </div>
    );
  };
  
  // Format timestamp safely
  const formattedTime = message.timestamp instanceof Date 
    ? message.timestamp.toLocaleTimeString()
    : new Date().toLocaleTimeString();

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        <Card className="bg-card p-3">
          <div className="whitespace-pre-wrap">
            {renderContent()}
          </div>
          
          {renderProgress()}
        </Card>
        
        {message.assets && (
          <LogoPreview assets={message.assets} />
        )}
        
        <div className="text-xs text-muted-foreground">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
