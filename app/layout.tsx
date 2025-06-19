'use client'

import './globals.css';
import { Raleway, Arimo, IBM_Plex_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';

// Load Raleway font for headings
const raleway = Raleway({ 
  subsets: ['latin'],
  weight: ['200', '300', '400', '600'],
  variable: '--font-raleway',
  display: 'swap'
});

// Load Arimo font for body text
const arimo = Arimo({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-arimo',
  display: 'swap'
});

// Load IBM Plex Mono for monospaced content
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap'
});

// Metadata moved to separate export to avoid 'use client' conflicts

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body 
        className={`${raleway.variable} ${arimo.variable} ${ibmPlexMono.variable}
                    font-body bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}