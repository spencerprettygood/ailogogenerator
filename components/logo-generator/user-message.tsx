import React from 'react';
import { Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/utils';

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  // Safely render message content
  const renderContent = () => {
    // Handle string content (most common case)
    if (typeof message.content === 'string') {
      return message.content;
    }

    // Handle array content
    if (Array.isArray(message.content)) {
      return (
        <>
          {message.content.map((item, index) => (
            <React.Fragment key={index}>
              {typeof item === 'string'
                ? item
                : item &&
                    typeof item === 'object' &&
                    'text' in item &&
                    typeof item.text === 'string'
                  ? item.text
                  : JSON.stringify(item)}
              {index < message.content.length - 1 ? ' ' : ''}
            </React.Fragment>
          ))}
        </>
      );
    }

    // Handle object content
    if (message.content && typeof message.content === 'object') {
      // Check for common text properties
      if ('text' in message.content && typeof message.content.text === 'string') {
        return message.content.text;
      }

      // Try to stringify the object
      try {
        return JSON.stringify(message.content);
      } catch {
        return '[Message content unavailable]';
      }
    }

    // Fallback for any other type
    return String(message.content || '');
  };

  // Format timestamp safely
  const formattedTime =
    message.timestamp instanceof Date
      ? message.timestamp.toLocaleTimeString()
      : new Date().toLocaleTimeString();

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-2">
        <Card className="bg-primary text-primary-foreground p-3">
          <div className="whitespace-pre-wrap">{renderContent()}</div>
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

        <div className="text-xs text-muted-foreground text-right">{formattedTime}</div>
      </div>
    </div>
  );
}
