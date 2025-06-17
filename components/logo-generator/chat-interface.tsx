'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message } from '@/lib/types';
import { MessageList } from './message-list';
import { TypingIndicator } from './typing-indicator';
import { FileUpload } from './file-upload-simple';
import { Paperclip, Send } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isGenerating: boolean;
  onSendMessageAction: (content: string, files?: File[]) => void;
  className?: string;
}

export function ChatInterface({
  messages,
  isGenerating,
  onSendMessageAction,
  className,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSendMessageAction(inputValue.trim(), selectedFiles);
      setInputValue('');
      setSelectedFiles([]);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isGenerating) {
      // Correctly cast the synthetic event to a FormEvent
      // This is a bit of a workaround as we're manually triggering form submission logic
      // from a textarea keypress. A more robust solution might involve a ref to the form.
      const mockFormEvent = {
        preventDefault: () => event.preventDefault(),
        // Add other properties if needed by handleSubmit, though typically not for this use case
      } as unknown as React.FormEvent<HTMLFormElement>;
      handleSubmit(mockFormEvent);
    }
  };

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length === 0) {
      setShowFileUpload(false);
    }
  };

  const canSubmit = (inputValue.trim() || selectedFiles.length > 0) && !isGenerating;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList messages={messages} />
        {isGenerating && <TypingIndicator />}
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your logo requirements..."
              className="min-h-[80px] pr-12 resize-none"
              disabled={isGenerating}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={() => setShowFileUpload(!showFileUpload)}
              disabled={isGenerating}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedFiles.length > 0 && `${selectedFiles.length} file(s) selected`}
              {inputValue.length > 0 && ` • ${inputValue.length} characters`}
            </div>
            
            <Button 
              type="submit" 
              disabled={!canSubmit}
              className="min-w-[100px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
