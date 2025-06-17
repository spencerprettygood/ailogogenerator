import React from 'react';
import { Card } from '@/components/ui/card';

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <Card className="bg-card p-3 max-w-[200px]">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">AI is thinking</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </Card>
    </div>
  );
}
