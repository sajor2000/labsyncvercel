'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/contexts/auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster 
        position="top-right"
        duration={4000}
        theme="dark"
      />
    </ThemeProvider>
  )
}