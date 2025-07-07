import './globals.css';
import './app-init'; // Initialize app services
import { Raleway, Arimo, IBM_Plex_Mono } from 'next/font/google';
import ThemedLayout from '@/components/providers/theme-fixed';
import type { Metadata, Viewport } from 'next';

// Load Raleway font for headings
const raleway = Raleway({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600'],
  variable: '--font-raleway',
  display: 'swap',
});

// Load Arimo font for body text
const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-arimo',
  display: 'swap',
});

// Load IBM Plex Mono for monospaced content
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

// Metadata for the application
export const metadata: Metadata = {
  title: 'AI Logo Generator',
  description: 'Generate professional logos using AI with custom branding options',
  applicationName: 'AI Logo Generator',
  authors: [{ name: 'AI Logo Generator Team' }],
  keywords: ['logo', 'design', 'ai', 'generator', 'branding', 'business', 'creative'],
  metadataBase: new URL('https://ailogogenerator.com'), // Update with your actual domain
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ailogogenerator.com',
    title: 'AI Logo Generator',
    description: 'Create stunning logos in minutes with AI technology',
    siteName: 'AI Logo Generator',
    images: [
      {
        url: 'https://ailogogenerator.com/og-image.jpg', // Replace with your actual OG image
        width: 1200,
        height: 630,
        alt: 'AI Logo Generator - Create professional logos instantly',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Logo Generator - Professional Logo Design',
    description: 'Create stunning logos in minutes with AI technology',
    creator: '@ailogogenerator',
    images: ['https://ailogogenerator.com/twitter-image.jpg'], // Replace with actual image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual verification code
  },
  alternates: {
    canonical: 'https://ailogogenerator.com',
    languages: {
      'en-US': 'https://ailogogenerator.com',
    },
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} ${arimo.variable} ${ibmPlexMono.variable}
                    font-body bg-background text-foreground antialiased`}
      >
        <ThemedLayout>{children}</ThemedLayout>
      </body>
    </html>
  );
}
