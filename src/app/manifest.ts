import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KaapiLibre Admin Portal',
    short_name: 'KL Admin',
    description: 'KaapiLibre Roastery & Storefront Admin Portal with real-time order and support notifications',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0d0c0a',
    theme_color: '#0d0c0a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/brand/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/logo_kaapilibre.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}

