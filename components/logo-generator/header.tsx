import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Github, Twitter, Sun, Moon } from 'lucide-react';
import { H5 } from '@/components/ui/typography';

interface HeaderProps {
  onThemeToggle?: () => void;
}

export function Header({ onThemeToggle }: HeaderProps) {
  return (
    <header className="relative border-b border-l-0 border-r-0 border-t-0 border-gray-300 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      {/* Asymmetric accent line */}
      <div className="absolute bottom-0 left-0 w-2/3 h-[1px] bg-accent"></div>
      <div className="absolute bottom-0 right-0 w-1/3 h-[1px] bg-gray-300"></div>
      
      <div className="container flex h-16 items-center justify-between p-uneven">
        {/* Logo - now with asymmetric spacing */}
        <div className="flex items-center gap-uneven-2 ml-uneven-1">
          <Sparkles className="h-6 w-6 text-accent" />
          <H5 className="m-0 text-asymmetric-heading">AI Logo Generator</H5>
          <Badge variant="asymmetric" className="text-xs ml-2 transform -translate-y-1">
            Beta
          </Badge>
        </div>

        {/* Actions - moved slightly off-center */}
        <div className="flex items-center gap-3 mr-uneven-2">
          {/* Theme Toggle */}
          {onThemeToggle && (
            <Button variant="ghost" size="icon" onClick={onThemeToggle} className="hidden md:flex">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          
          {/* Social Links with asymmetric spacing */}
          <div className="flex items-center" style={{ gap: '7px' }}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-scale-skew"
            >
              <Button variant="ghost" size="icon" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-scale-skew"
            >
              <Button variant="ghost" size="icon" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}