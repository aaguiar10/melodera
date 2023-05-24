/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.scdn.co'
      },
      {
        protocol: 'https',
        hostname: '*.spotifycdn.com'
      }
    ]
  }
}

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' // disabled in dev
})

module.exports = withPWA(nextConfig)
