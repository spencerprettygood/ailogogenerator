import './globals.css';
import './asymmetric-utils.css';
import './typography.css';
import type { Metadata } from 'next';
import { Raleway, Arimo, IBM_Plex_Mono } from 'next/font/google';

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

export const metadata: Metadata = {
  title: 'AI Logo Generator',
  description: 'Generate professional-quality logos with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${raleway.variable} ${arimo.variable} ${ibmPlexMono.variable}`}>
      <body className="font-arimo bg-background text-foreground text-base antialiased">
        {children}
      </body>
    </html>
  );
}