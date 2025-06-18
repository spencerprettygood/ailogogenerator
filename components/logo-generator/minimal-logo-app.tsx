'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLogoGeneration } from "@/lib/hooks/use-logo-generation";
import { useToast } from "@/lib/hooks/use-toast";
import { Toaster } from '@/components/ui/toaster';
import { generateId } from 'ai';
import { Send, ArrowLeft, Plus } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export function MinimalLogoApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [currentLogoSvg, setCurrentLogoSvg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Handle progress updates
  useEffect(() => {
    if (progress && progress.message) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isLoading) {
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: progress.message || 'Processing...' }
              : msg
          );
        } else {
          return [...prev, {
            id: generateId(),
            role: 'assistant',
            content: progress.message || 'Processing...',
            timestamp: new Date(),
            isLoading: true
          }];
        }
      });
    }
  }, [progress]);

  // Handle completion
  useEffect(() => {
    if (assets && preview) {
      setCurrentLogoSvg(preview);
      setMessages(prev => 
        prev.map(msg => 
          msg.isLoading 
            ? { ...msg, content: '✓ Logo generated successfully', isLoading: false }
            : msg
        )
      );
      toast({
        title: "Logo Generated",
        description: "Your logo is ready for download.",
      });
    }
  }, [assets, preview, toast]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      await generateLogo(input.trim());
    } catch (err) {
      console.error('Generation failed:', err);
    }
  }, [input, isGenerating, generateLogo]);

  const handleNew = useCallback(() => {
    reset();
    setMessages([]);
    setCurrentLogoSvg(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [reset]);

  const handleBack = useCallback(() => {
    if (messages.length > 0) {
      setMessages([]);
      setCurrentLogoSvg(null);
    }
  }, [messages.length]);

  return (
    <div className="min-h-screen bg-pure-white font-raleway flex">
      {/* Left Chat Panel - Desktop */}
      <div className={`fixed left-0 top-0 h-full bg-pure-white border-r-1 border-pure-black transition-transform duration-400 z-50 ${
        isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'
      } w-96 lg:relative lg:translate-x-0`}>
        
        {/* Chat Header */}
        <div className="h-16 border-b-1 border-pure-black flex items-center justify-between px-6">
          <h1 className="font-bold text-lg">AI Logo Generator</h1>
          <button 
            onClick={() => setIsLeftPanelOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            aria-label="Close chat panel"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 h-[calc(100vh-8rem)]">
          {messages.length === 0 ? (
            <div className="text-center space-y-4 mt-12">
              <div className="w-16 h-16 mx-auto border-1 border-pure-black rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8" strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <h2 className="font-bold text-xl">Create Your Logo</h2>
                <p className="font-light text-sm">
                  Describe your brand and I&apos;ll generate a professional logo for you.
                </p>
              </div>
              <div className="space-y-2 text-left">
                <div className="text-xs font-light text-gray-600">Try these examples:</div>
                <button 
                  onClick={() => setInput('Modern tech startup logo with clean lines')}
                  className="block w-full text-left text-sm font-light p-2 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  &ldquo;Modern tech startup logo with clean lines&rdquo;
                </button>
                <button 
                  onClick={() => setInput('Organic cafe logo with earth tones')}
                  className="block w-full text-left text-sm font-light p-2 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  &ldquo;Organic cafe logo with earth tones&rdquo;
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="text-xs font-light text-gray-600">
                    {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : 'System'}
                  </div>
                  <div className={`text-sm font-light ${
                    message.role === 'user' ? 'font-normal' : 
                    message.role === 'system' ? 'text-accent' : ''
                  }`}>
                    {message.content}
                    {message.isLoading && (
                      <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse ml-2" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <div className="h-16 border-t-1 border-pure-black p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your logo..."
              className="flex-1 bg-transparent font-light text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 px-2 py-1 transition-all duration-200"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="text-accent hover:text-accent-dark disabled:text-gray-300 transition-colors duration-200 p-1"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" strokeWidth={1} />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-0 ml-0">
        {/* Top Actions Bar */}
        <div className="h-16 border-b-1 border-pure-black flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsLeftPanelOpen(true)}
              className="lg:hidden text-pure-black hover:text-accent transition-colors duration-200"
              aria-label="Open chat panel"
            >
              Chat
            </button>
            {messages.length > 0 && (
              <button 
                onClick={handleBack}
                className="text-pure-black hover:text-accent transition-colors duration-200 font-light text-sm"
              >
                Back
              </button>
            )}
          </div>
          
          <button 
            onClick={handleNew}
            className="text-pure-black hover:text-accent transition-colors duration-200 font-light text-sm"
          >
            New
          </button>
        </div>

        {/* Logo Display Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentLogoSvg ? (
            <div className="w-full max-w-md">
              <div 
                className="w-full aspect-square flex items-center justify-center border-1 border-pure-black rounded-lg p-8"
                dangerouslySetInnerHTML={{ __html: currentLogoSvg }}
              />
              <div className="mt-6 text-center space-y-4">
                <div className="text-sm font-light text-gray-600">
                  Your logo is ready
                </div>
                {assets && (
                  <div className="flex justify-center space-x-4">
                    <button className="text-accent hover:text-accent-dark font-light text-sm transition-colors duration-200">
                      Download SVG
                    </button>
                    <button className="text-accent hover:text-accent-dark font-light text-sm transition-colors duration-200">
                      Download PNG
                    </button>
                    <button className="text-accent hover:text-accent-dark font-light text-sm transition-colors duration-200">
                      Download Package
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto border-1 border-gray-200 rounded-lg flex items-center justify-center">
                <Plus className="w-16 h-16 text-gray-300" strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <div className="font-bold text-lg">Your Logo Will Appear Here</div>
                <div className="font-light text-sm text-gray-600 max-w-md mx-auto">
                  Start by describing your brand in the chat panel. I&apos;ll generate a professional logo based on your requirements.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toaster />
    </div>
  );
}
