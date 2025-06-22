'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/lib/hooks/use-toast";
import { MessageList } from './message-list';
import { TypingIndicator } from './typing-indicator';
import { FileUploadSimple as FileUpload } from './file-upload-simple';
import { Paperclip, Send, Loader2 } from 'lucide-react';

// Pattern to detect the logo generation trigger command
const GENERATE_LOGO_PATTERN = /\[GENERATE_LOGO\]/i;

interface ChatInterfaceProps {
  onSendMessageAction: (content: string, files?: File[]) => void;
  isGenerating?: boolean;
  className?: string;
}

export function ChatInterface({
  onSendMessageAction,
  isGenerating = false,
  className,
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [generationRequested, setGenerationRequested] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the chat with the standard useChat hook
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: submitChat, 
    isLoading, 
    error 
  } = useChat({
    api: '/api/chat',
    onResponse: (response) => {
      // Check response status
      if (!response.ok) {
        toast({
          title: "API Error",
          description: `Error ${response.status}: ${response.statusText}`,
          variant: "destructive"
        });
      }
    }
  });

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check for [GENERATE_LOGO] command in the latest assistant message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage && 
      lastMessage.role === 'assistant' && 
      !generationRequested
    ) {
      // Check if message content contains the trigger pattern
      const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
      const containsTrigger = GENERATE_LOGO_PATTERN.test(content);
      
      if (containsTrigger) {
        // Extract the full prompt from all user messages
        const fullPrompt = messages
          .filter(msg => msg.role === 'user')
          .map(msg => {
            return typeof msg.content === 'string' ? msg.content : '';
          })
          .join('\n\n');
        
        // Trigger logo generation
        onSendMessageAction(fullPrompt, selectedFiles);
        setGenerationRequested(true);
        setSelectedFiles([]);
        
        toast({
          title: "Starting Logo Generation",
          description: "Creating your logo based on our conversation..."
        });
      }
    }
  }, [messages, onSendMessageAction, generationRequested, toast, selectedFiles]);

  // Display error notifications
  useEffect(() => {
    if (error) {
      toast({
        title: "Chat Error",
        description: error.message || "Something went wrong with the chat",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Custom submit handler for the chat
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim() || selectedFiles.length > 0) {
      // Process files if needed
      if (selectedFiles.length > 0) {
        // For now, we'll just pass them to the onSendMessageAction
      }
      
      // Reset generation requested flag when sending a new message
      setGenerationRequested(false);
      
      // Submit the chat message
      submitChat(event);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isLoading && !isGenerating) {
      const mockFormEvent = {
        preventDefault: () => event.preventDefault(),
      } as unknown as React.FormEvent<HTMLFormElement>;
      handleFormSubmit(mockFormEvent);
    }
  };

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length === 0) {
      setShowFileUpload(false);
    }
  };

  const canSubmit = (input.trim() || selectedFiles.length > 0) && !isLoading && !isGenerating && !generationRequested;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            Start a conversation to design your logo
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => {
              return (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-12' 
                      : 'bg-muted mr-12'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {message.role === 'user' ? 'You' : 'AI Designer'}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {/* Display message content */}
                    {typeof message.content === 'string' ? message.content : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="border-t p-4">
          <FileUpload
            onFilesChangeAction={handleFilesChange}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Describe your logo requirements..."
              className="min-h-[80px] pr-12 resize-none"
              disabled={isLoading || isGenerating || generationRequested}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={() => setShowFileUpload(!showFileUpload)}
              disabled={isLoading || isGenerating || generationRequested}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedFiles.length > 0 && `${selectedFiles.length} file(s) selected`}
              {input.length > 0 && ` • ${input.length} characters`}
            </div>
            
            <Button 
              type="submit" 
              disabled={!canSubmit}
              className="min-w-[100px]"
            >
              {isLoading || isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isGenerating ? 'Generating...' : 'Thinking...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      <Toaster />
    </div>
  );
}