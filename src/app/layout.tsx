import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hey.ai'),
  title: {
    default: 'HEY - Your AI Assistant Like Jarvis',
    template: '%s | HEY',
  },
  description: 'HEY is your personal AI assistant powered by GPT-4o, Claude 3, and more. Chat, create, and get things done with the most advanced AI models.',
  keywords: ['AI assistant', 'chatbot', 'GPT-4o', 'Claude 3', 'Jarvis', 'AI chat', 'productivity'],
  authors: [{ name: 'HEY Team' }],
  creator: 'HEY',
  publisher: 'HEY',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hey.ai',
    siteName: 'HEY',
    title: 'HEY - Your AI Assistant Like Jarvis',
    description: 'HEY is your personal AI assistant powered by GPT-4o, Claude 3, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HEY AI Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEY - Your AI Assistant Like Jarvis',
    description: 'HEY is your personal AI assistant powered by GPT-4o, Claude 3, and more.',
    images: ['/og-image.png'],
    creator: '@hey_ai',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
    shortcut: '/favicon-16x16.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}