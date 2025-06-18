'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLogoGeneration } from "@/lib/hooks/use-logo-generation";
import { useToast } from "@/lib/hooks/use-toast";
import { Toaster } from '@/components/ui/toaster';
import { generateId } from 'ai';
import { Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

// Smart follow-up questions to help users define their logo needs
const FOLLOW_UP_QUESTIONS = [
  "What industry is your business in?",
  "What mood should your logo convey? (Professional, playful, modern, etc.)",
  "Do you have any color preferences or brand colors?",
  "Who is your target audience?",
  "Are there any logos you admire? What do you like about them?",
  "What should your logo NOT look like?",
  "Will this logo be used more online or in print?",
  "Do you need text in the logo or just a symbol?"
];

export function CenteredLogoChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: "Hi! I'm your AI logo designer. Let's create something amazing together. What's your business name and what kind of logo are you looking for?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const {
    generateLogo,
    isGenerating,
    progress,
    preview,
    assets,
    error,
    reset
  } = useLogoGeneration();

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle progress updates and show them in chat
  useEffect(() => {
    if (progress) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.role === 'assistant' && latestMessage.isLoading) {
        setMessages(prev => prev.slice(0, -1).concat({
          ...latestMessage,
          content: `${progress.currentStage}: ${progress.message} (${Math.round(progress.overallProgress)}%)`,
          isLoading: true
        }));
      }
    }
  }, [progress, messages]);

  // Handle generation completion
  useEffect(() => {
    if (assets) {
      setMessages(prev => prev.slice(0, -1).concat([
        {
          id: generateId(),
          role: 'assistant',
          content: `🎉 Your logo is ready! I've created a complete branding package with your SVG logo, PNG variants, and brand guidelines.`,
          timestamp: new Date()
        }
      ]));
    }
  }, [assets]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setMessages(prev => prev.slice(0, -1).concat([
        {
          id: generateId(),
          role: 'assistant',
          content: `I encountered an issue: ${error.message}. Let's try again! Can you provide a bit more detail about what you're looking for?`,
          timestamp: new Date()
        }
      ]));
    }
  }, [error]);

  const askFollowUpQuestion = useCallback(() => {
    if (currentStep < FOLLOW_UP_QUESTIONS.length) {
      const question = FOLLOW_UP_QUESTIONS[currentStep];
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: question,
        timestamp: new Date()
      }]);
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Analyze the message to determine next action
    const messageCount = messages.filter(m => m.role === 'user').length;
    
    if (messageCount < 3) {
      // Ask follow-up questions to gather more info
      setTimeout(() => {
        askFollowUpQuestion();
      }, 1000);
    } else {
      // We have enough info, start generation
      const loadingMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Perfect! I have everything I need. Let me start creating your logo...',
        timestamp: new Date(),
        isLoading: true
      };

      setMessages(prev => [...prev, loadingMessage]);

      try {
        const allUserMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
        const fullBrief = `${allUserMessages} ${input.trim()}`;
        await generateLogo(fullBrief);
      } catch (err) {
        console.error('Generation failed:', err);
      }
    }
  }, [input, isGenerating, messages, generateLogo, askFollowUpQuestion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Centered Chat Container - Perfect mirror-plane symmetry */}
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Header - Raleway Bold */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Logo Designer
          </h1>
          <p className="text-lg font-light text-foreground/80">
            Create professional logos through conversation
          </p>
        </div>

        {/* Chat Messages Container */}
        <div className="bg-card border border-border rounded-lg shadow-sm mb-4 h-96 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg transition-all duration-micro ease-fast-out-slow-in ${
                    message.role === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  <p className={`text-sm ${message.role === 'user' ? 'font-light' : 'font-light'}`}>
                    {message.content}
                  </p>
                  {message.isLoading && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-accent rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Progress indicator when generating */}
            {progress && (
              <div className="flex justify-center">
                <div className="bg-muted border border-border rounded-lg p-4 max-w-sm">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-accent animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-light text-foreground">
                        {progress.currentStage}
                      </p>
                      <div className="w-full bg-border rounded-full h-1 mt-2">
                        <div 
                          className="bg-accent h-1 rounded-full transition-all duration-micro ease-fast-out-slow-in"
                          style={{ width: `${progress.overallProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logo preview */}
            {preview && (
              <div className="flex justify-center">
                <div className="bg-card border border-border rounded-lg p-6 max-w-sm">
                  <div className="text-center">
                    <div 
                      className="w-32 h-32 mx-auto mb-4 border border-border rounded-lg flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: preview }}
                    />
                    <p className="text-sm font-light text-foreground">
                      Preview of your logo
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick suggestions - Only show early in conversation */}
        {messages.filter(m => m.role === 'user').length < 2 && (
          <div className="mb-4">
            <p className="text-sm font-light text-foreground/80 mb-2 text-center">
              Quick suggestions:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Tech startup', 'Restaurant', 'Consulting firm', 'Creative agency'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(`I need a logo for my ${suggestion.toLowerCase()}`)}
                  className="px-3 py-1 text-sm border border-border rounded-full hover:bg-muted transition-all duration-micro ease-fast-out-slow-in focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area - Minimal and centered */}
        <div className="relative">
          <div className="flex items-end space-x-3 bg-card border border-border rounded-lg p-3 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 transition-all duration-micro ease-fast-out-slow-in">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your logo idea..."
              disabled={isGenerating}
              className="flex-1 resize-none bg-transparent border-none focus:outline-none text-sm font-light text-foreground placeholder-foreground/50 min-h-[20px] max-h-32"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '20px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            
            {/* Send Button - Text link until focus/hover, then outlined */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="group flex items-center space-x-2 text-sm font-light text-accent hover:text-accent-foreground hover:bg-accent px-3 py-2 rounded-md border border-transparent hover:border-accent transition-all duration-micro ease-fast-out-slow-in focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Actions - Cap at 3 as specified */}
        <div className="flex justify-center space-x-6 mt-6">
          <button 
            onClick={reset}
            className="text-sm font-light text-foreground/80 hover:text-foreground hover:border-b hover:border-foreground transition-all duration-micro ease-fast-out-slow-in focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            New
          </button>
          {assets && (
            <a 
              href={assets.zipPackageUrl}
              download
              className="text-sm font-light text-accent hover:text-accent-foreground hover:border-b hover:border-accent transition-all duration-micro ease-fast-out-slow-in focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Download
            </a>
          )}
        </div>
      </div>

      <Toaster />
    </div>
  );
}
