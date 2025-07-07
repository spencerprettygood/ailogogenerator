import React from 'react';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  // Safely display message content
  const getMessageContent = () => {
    // Handle string content
    if (typeof message.content === 'string') {
      return message.content;
    }

    // Handle array content
    if (Array.isArray(message.content)) {
      return message.content
        .map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string')
            return item.text;
          return JSON.stringify(item);
        })
        .join(' ');
    }

    // Handle object content
    if (message.content && typeof message.content === 'object') {
      if ('message' in message.content && typeof message.content.message === 'string') {
        return message.content.message;
      }
      if ('text' in message.content && typeof message.content.text === 'string') {
        return message.content.text;
      }
      try {
        return JSON.stringify(message.content);
      } catch {
        return 'System message';
      }
    }

    // Fallback
    return String(message.content || 'System message');
  };

  return (
    <div className="flex justify-center">
      <Badge variant="outline" className="text-xs">
        {getMessageContent()}
      </Badge>
    </div>
  );
}
