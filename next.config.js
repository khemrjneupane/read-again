import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const cfUrl = process.env.CLOUDFLARE_IMAGE_URL
  ? `https://${process.env.CLOUDFLARE_IMAGE_URL}`
  : null

const cfHost = cfUrl ? new URL(cfUrl).hostname : null

const nextConfig = {
  images: {
    minimumCacheTTL: 2678400,
    formats: ['image/webp'],
    deviceSizes: [640, 768, 1024],
    imageSizes: [32, 64],
    remotePatterns: [
      ...(cfHost
        ? [
            {
              protocol: 'https',
              hostname: cfHost,
              pathname: '/book-storage/**',
            },
          ]
        : []),

      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'js.stripe.com' },
      { protocol: 'https', hostname: 'q.stripe.com' },
      { protocol: 'https', hostname: 'files.stripe.com' },
      { protocol: 'https', hostname: 'used-books.netlify.app' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  reactStrictMode: true,
  redirects,
  devIndicators: false,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
