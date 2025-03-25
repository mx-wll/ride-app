import withPWA from 'next-pwa'
import { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(config)