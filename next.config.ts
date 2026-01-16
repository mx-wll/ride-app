import withPWA from 'next-pwa'
import { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: false, // Disabled to prevent AbortError with Supabase SSR client
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

// Disable PWA in development to avoid Turbopack/Webpack conflict
const isDev = process.env.NODE_ENV === 'development'

export default isDev
  ? config
  : withPWA({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
    })(config)
