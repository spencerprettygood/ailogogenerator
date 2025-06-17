'use client'

import React from 'react';
import { Message } from '@/lib/types';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { SystemMessage } from './system-message';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-lg font-medium mb-2">Welcome to AI Logo Generator</div>
        <p>Describe your logo requirements to get started. You can include:</p>
        <ul className="text-sm mt-2 space-y-1">
          <li>• Company/brand name</li>
          <li>• Industry and target audience</li>
          <li>• Style preferences (modern, classic, etc.)</li>
          <li>• Color preferences</li>
          <li>• Specific imagery or symbols</li>
        </ul>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => {
        switch (message.role) {
          case 'user':
            return <UserMessage key={message.id} message={message} />;
          case 'assistant':
            return <AssistantMessage key={message.id} message={message} />;
          case 'system':
            return <SystemMessage key={message.id} message={message} />;
          default:
            return null;
        }
      })}
    </>
  );
}
