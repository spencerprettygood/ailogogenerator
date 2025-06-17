import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Menu, Github, Twitter } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">AI Logo Generator</span>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Social Links */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
          </div>

          {/* Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onMenuToggle}
            className="hidden lg:flex"
            aria-label={sidebarOpen ? 'Hide panel' : 'Show panel'}
          >
            {sidebarOpen ? 'Hide Panel' : 'Show Panel'}
          </Button>
        </div>
      </div>
    </header>
  );
}
