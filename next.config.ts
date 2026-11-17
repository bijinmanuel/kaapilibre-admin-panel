import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: 'security',
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }, { protocol: 'https', hostname: 'placehold.co' }] },
}

export default nextConfig
