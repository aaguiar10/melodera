const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD
} = require('next/constants')

/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */
module.exports = async phase => {
  /** @type {import("next").NextConfig} */
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

  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import('@serwist/next')).default({
      swSrc: 'worker/index.ts',
      swDest: 'public/sw.js',
      disable: process.env.NODE_ENV === 'development'
    })
    return withSerwist(nextConfig)
  }

  return nextConfig
}
