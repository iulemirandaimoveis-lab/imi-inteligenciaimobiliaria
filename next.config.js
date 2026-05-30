// @ts-check
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    buildExcludes: [/\.map$/, /middleware-manifest\.json$/],
    customWorkerDir: 'worker',
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'imi-images', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 } },
        },
        {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'imi-api', expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 } },
        },
        {
            urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 } },
        },
    ],
})
const { withSentryConfig } = require('@sentry/nextjs')

const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@imi/cad-generator': path.resolve(__dirname, 'packages/imi-cad-generator/src/index.ts'),
            '@imi/scene-adapter': path.resolve(__dirname, 'packages/imi-scene-adapter/src/index.ts'),
            '@imi/property-metadata': path.resolve(__dirname, 'packages/imi-property-metadata/src/index.ts'),
            '@imi/domain': path.resolve(__dirname, 'packages/imi-domain/src/index.ts'),
            '@imi/crm-adapter': path.resolve(__dirname, 'packages/imi-crm-adapter/src/index.ts'),
            '@imi/templates': path.resolve(__dirname, 'templates/index.ts'),
        }
        return config
    },
    eslint: {
        ignoreDuringBuilds: true, // TODO: fix ESLint errors then set to false
    },
    typescript: {
        ignoreBuildErrors: true, // Types verified in CI; Vercel 8GB OOMs during type-check
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'zocffccwjjyelwrgunhu.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.in',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
        optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'sonner', 'date-fns'],
    },
    // Security headers
    async headers() {
        return [
            {
                source: '/images/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/books/(.*)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://api.mapbox.com https://*.sentry-cdn.com`.trim(),
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
                            "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.mapbox.com https://*.basemaps.cartocdn.com https://*.googleapis.com https://*.gstatic.com https://*.google.com https://img.youtube.com https://i.ytimg.com",
                            "font-src 'self' https://fonts.gstatic.com https://fonts.mapbox.com",
                            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://*.mapbox.com https://www.google-analytics.com https://basemaps.cartocdn.com https://*.ingest.sentry.io https://*.sentry.io",
                            "worker-src 'self' blob:",
                            "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                ],
            },
        ]
    },
}

module.exports = withSentryConfig(withPWA(nextConfig), {
    silent: true,
    hideSourceMaps: true,
    disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
    disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
})
