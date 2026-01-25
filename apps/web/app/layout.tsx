/**
 * MyMind Clone - Root Layout
 * 
 * Light theme layout matching mymind.com aesthetic.
 * Uses Libre Baskerville serif + Inter sans-serif fonts.
 * 
 * @fileoverview Root layout with light theme
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { AuthTokenSync } from '@/components/AuthTokenSync';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { designTokensScript } from '@/lib/design-tokens';

// =============================================================================
// FONT CONFIGURATION
// =============================================================================

/**
 * Inter font for body text - clean and modern.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: {
    default: 'digital consumption, make connection, recall anything.',
    template: '%s | Creative Brain',
  },
  description:
    'A privacy-first, AI-powered visual knowledge manager. Save anything with one click. Find it naturally. No folders, no manual tags.',
  keywords: [
    'knowledge management',
    'bookmarks',
    'notes',
    'ai',
    'visual search',
    'productivity',
    'second brain',
  ],
  authors: [{ name: 'Portfolio Project' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: 'mymind - Your visual mind, organized',
    description: 'Save anything with one click. Find it naturally.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F7F6F3', // Warm off-white
};

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inline script to prevent theme/design token flash */}
        <script dangerouslySetInnerHTML={{ __html: designTokensScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthTokenSync />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
