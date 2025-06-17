import React from 'react';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LogoPreview } from './logo-preview';

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        <Card className="bg-card p-3">
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {message.progress && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Stage {message.progress.stage}: {message.progress.message}</span>
                <span>{message.progress.progress}%</span>
              </div>
              <Progress value={message.progress.progress} />
            </div>
          )}
        </Card>
        
        {message.assets && (
          <LogoPreview assets={message.assets} />
        )}
        
        <div className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
