import React from 'react';
import { DesignSystemGuide } from '../../components/ui/design-system-guide';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              <span className="text-accent">AI</span> Logo Generator
            </h1>
            <div className="text-sm text-gray-600">
              Design System Documentation
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <DesignSystemGuide />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} AI Logo Generator Design System
          <div className="mt-2">
            Monochrome + <span className="text-accent font-medium">#FF4233</span> Accent
          </div>
        </div>
      </footer>
    </div>
  );
}