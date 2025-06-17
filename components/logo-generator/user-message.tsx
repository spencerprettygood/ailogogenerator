import React from 'react';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/utils';

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-2">
        <Card className="bg-primary text-primary-foreground p-3">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </Card>
        
        {message.files && message.files.length > 0 && (
          <div className="space-y-2">
            {message.files.map((file: File, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {file.name} ({formatFileSize(file.size)})
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-right">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
