import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const viewport: Viewport = {
  themeColor: '#0d0c0a',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'KaapiLibre Admin',
  description: 'Admin panel for KaapiLibre coffee brand',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KL Admin',
  },
  icons: {
    icon: '/brand/logo.png',
    apple: '/brand/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
