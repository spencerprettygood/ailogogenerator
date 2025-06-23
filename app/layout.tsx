import './globals.css';
import { Raleway, Arimo, IBM_Plex_Mono } from 'next/font/google';
import { ThemeProviderClient } from '@/components/providers/theme-provider-client';
import type { Metadata, Viewport } from 'next';

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

// Metadata for the application
export const metadata: Metadata = {
  title: 'AI Logo Generator',
  description: 'Generate professional logos using AI',
  applicationName: 'AI Logo Generator',
  authors: [{ name: 'AI Logo Generator Team' }],
  keywords: ['logo', 'design', 'ai', 'generator', 'branding'],
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#121212' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className={`${raleway.variable} ${arimo.variable} ${ibmPlexMono.variable}
                    font-body bg-background text-foreground antialiased`}
      >
        <ThemeProviderClient
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProviderClient>
      </body>
    </html>
  );
}