'use client'

import React, { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CornerUpLeft, Download } from 'lucide-react';
import { Raleway } from 'next/font/google';
import { useLogoGeneration } from "@/lib/hooks/use-logo-generation";
import { Toaster } from '@/components/ui/toaster';

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['200', '400', '700'],
  variable: '--font-raleway',
});

export function AsymmetricalLogoChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    // Pointing to a new conversational API route
    api: '/api/chat', 
  });

  const {
    preview,
    assets,
    reset: resetLogoGeneration,
  } = useLogoGeneration();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const handleReset = () => {
    resetLogoGeneration();
    setMessages([]);
  };

  return (
    <div className={`${raleway.variable} font-sans min-h-screen bg-background text-foreground flex`}>
      <motion.div 
        className="w-1/3 bg-muted p-8 flex flex-col justify-between"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <div>
          <h1 className="text-4xl font-bold">LogoGen</h1>
          <p className="text-lg font-light mt-2">Asymmetrical Design</p>
        </div>
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <h2 className="text-xl font-bold mb-4">Live Preview</h2>
              <div 
                className="w-full h-64 bg-white rounded-lg shadow-inner flex items-center justify-center p-4"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-4">
          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-foreground rounded-full hover:bg-foreground hover:text-background transition-all duration-micro"
          >
            <CornerUpLeft className="w-5 h-5" />
            <span>New Session</span>
          </button>
          {assets && (
            <a 
              href={assets.zipPackageUrl}
              download
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-accent text-accent-foreground rounded-full hover:opacity-90 transition-opacity"
            >
              <Download className="w-5 h-5" />
              <span>Download Package</span>
            </a>
          )}
        </div>
      </motion.div>

      <div className="w-2/3 flex flex-col p-4">
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex my-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-lg p-4 rounded-2xl ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                  <p className="text-sm">{m.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <motion.div 
          className="px-6 pb-6"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <form onSubmit={handleFormSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Tell me about your logo..."
              className="w-full resize-none bg-muted border border-transparent rounded-full py-3 px-6 pr-20 focus:outline-none focus:ring-2 focus:ring-accent"
              rows={1}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-accent-foreground rounded-full p-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </motion.div>
      </div>
      <Toaster />
    </div>
  );
}
