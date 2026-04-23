'use client'
import { ThemeProvider } from 'next-themes'
import { ReactQueryProvider } from '@/lib/queryClient'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ReactQueryProvider>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </ReactQueryProvider>
    </ThemeProvider>
  )
}
