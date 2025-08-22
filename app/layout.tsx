import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { WebVitals } from '@/components/web-vitals'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'LabFlow - Medical Research Lab Management System',
    template: '%s | LabFlow'
  },
  description: 'Streamline your medical research lab operations with AI-powered meeting transcription, task management, team collaboration, and study tracking. Built for research teams.',
  keywords: ['medical research', 'lab management', 'AI transcription', 'task management', 'research collaboration', 'study tracking'],
  authors: [{ name: 'LabFlow Team' }],
  creator: 'LabFlow Team',
  metadataBase: new URL('https://labflow.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://labflow.vercel.app',
    title: 'LabFlow - Medical Research Lab Management System',
    description: 'Streamline your medical research lab operations with AI-powered features.',
    siteName: 'LabFlow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LabFlow - Medical Research Lab Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LabFlow - Medical Research Lab Management',
    description: 'AI-powered lab management for research teams',
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
    <html lang="en">
      <body className={inter.className}>
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