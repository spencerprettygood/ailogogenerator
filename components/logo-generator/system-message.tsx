import React from 'react';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex justify-center">
      <Badge variant="outline" className="text-xs">
        {message.content}
      </Badge>
    </div>
  );
}
