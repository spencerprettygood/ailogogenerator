'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, FileImage } from 'lucide-react';
import { FileUpload as FileUploadUnified } from './file-upload-unified';

interface SearchInterfaceProps {
  onSubmitAction: (prompt: string, files?: File[]) => void;
  isGenerating: boolean;
  className?: string;
  placeholder?: string;
}

export function SearchInterface({
  onSubmitAction,
  isGenerating,
  className = '',
  placeholder = 'Describe your perfect logo...'
}: SearchInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current && !isGenerating) {
      inputRef.current.focus();
    }
  }, [isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || files.length > 0) {
      onSubmitAction(prompt, files);
      setPrompt('');
      setFiles([]);
      setShowFileUpload(false);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setShowFileUpload(false);
    }
  };

  const canSubmit = (prompt.trim() || files.length > 0) && !isGenerating;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="rounded-xl border bg-card shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative p-2">
            <Input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              className="pr-20 py-6 text-lg bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isGenerating}
            />
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isGenerating}
              >
                <FileImage className="h-4 w-4" />
              </Button>
              
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!canSubmit}
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {showFileUpload && (
            <div className="px-4 pb-3">
              <FileUploadUnified
                onFilesChange={handleFilesChange}
                maxFiles={3}
                maxFileSizeMb={10}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
            </div>
          )}
          
          {files.length > 0 && (
            <div className="px-4 pb-3 text-sm text-muted-foreground">
              {files.length} image{files.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </form>
      </div>
    </div>
  );
}