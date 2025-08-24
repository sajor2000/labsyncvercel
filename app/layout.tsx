import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { WebVitals } from '@/components/web-vitals'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Lab Sync - Making Science Easier',
    template: '%s | Lab Sync'
  },
  description: 'Lab Sync - Making Science Easier. Simple, efficient lab management with AI-powered meeting transcription, task tracking, and team collaboration for research labs.',
  keywords: ['medical research', 'lab management', 'AI transcription', 'task management', 'research collaboration', 'study tracking'],
  authors: [{ name: 'Lab Sync Team' }],
  creator: 'Lab Sync Team',
  metadataBase: new URL('https://labsync-production.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://labsync-production.vercel.app',
    title: 'Lab Sync - Making Science Easier',
    description: 'Simple, efficient lab management for research teams.',
    siteName: 'Lab Sync',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lab Sync - Making Science Easier',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lab Sync - Making Science Easier',
    description: 'Simple lab management for research teams',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div id="root">
            {children}
          </div>
        </Providers>
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}