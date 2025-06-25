'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Upload, X } from 'lucide-react';
import { FileUpload as FileUploadUnified } from './file-upload-unified';

interface PerplexitySearchProps {
  onSubmitAction: (prompt: string, files?: File[]) => void;
  isGenerating: boolean;
  className?: string;
  placeholder?: string;
  compact?: boolean;
}

export function PerplexitySearch({
  onSubmitAction,
  isGenerating,
  className = '',
  placeholder = 'Describe your perfect logo...',
  compact = false
}: PerplexitySearchProps) {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Focus input on component mount
  useEffect(() => {
    if (textareaRef.current && !isGenerating && !compact) {
      textareaRef.current.focus();
    }
  }, [isGenerating, compact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || files.length > 0) {
      onSubmitAction(prompt, files);
      setPrompt('');
      setFiles([]);
      setShowFileUpload(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setShowFileUpload(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      className={`w-full ${className}`}
      initial={compact ? {} : { opacity: 0, y: 20 }}
      animate={compact ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div 
          className={`
            relative border-2 rounded-2xl bg-background transition-all duration-300
            ${isFocused 
              ? 'border-primary shadow-lg shadow-primary/20' 
              : 'border-border hover:border-primary/50'
            }
            ${compact ? 'rounded-xl' : ''}
          `}
        >
          {/* File Upload Preview */}
          {files.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-muted rounded-lg p-2 text-sm"
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-0 w-4 h-4"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Main Input Area */}
          <div className="flex items-end gap-3 p-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={isGenerating}
                className={`
                  resize-none border-0 bg-transparent p-0 focus:ring-0 focus:outline-none
                  placeholder:text-muted-foreground/60 text-base leading-relaxed w-full
                  ${compact ? 'min-h-[40px]' : 'min-h-[60px]'} max-h-[200px]
                `}
                rows={compact ? 1 : 2}
              />
              
              {/* Floating AI Icon */}
              {!prompt && !compact && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-3 right-3 text-primary"
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* File Upload Toggle */}
              <Button
                type="button"
                variant={showFileUpload ? "secondary" : "ghost"}
                size="sm"
                className={`h-10 w-10 p-0 ${compact ? 'h-8 w-8' : ''}`}
                onClick={() => setShowFileUpload(!showFileUpload)}
                disabled={isGenerating}
              >
                <Upload className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </Button>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary"
                disabled={!prompt.trim() && files.length === 0 || isGenerating}
                className={`
                  h-10 px-6 rounded-xl font-medium transition-all duration-200
                  ${compact ? 'h-8 px-4 text-sm' : ''}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:shadow-lg hover:shadow-primary/20
                `}
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                  </motion.div>
                ) : (
                  <Send className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                )}
                {compact ? 'Ask' : 'Generate Logo'}
              </Button>
            </div>
          </div>

          {/* Keyboard Shortcut Hint */}
          {!compact && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">⌘</kbd> + <kbd className="px-1 py-0.5 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">Enter</kbd> to submit
              </p>
            </div>
          )}
        </div>

        {/* File Upload Panel */}
        {showFileUpload && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-10"
          >
            <div className="bg-background border border-border rounded-xl p-4 shadow-lg">
              <FileUploadUnified 
                onFilesChangeAction={handleFilesChange}
                maxFiles={3}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}
