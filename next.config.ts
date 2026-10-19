import type { NextConfig } from 'next';

const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
];

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,

    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                source: '/favicon.svg',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }],
            },
            {
                source: '/favicon.ico',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }],
            },
            {
                source: '/og-image.png',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
            },
            {
                source: '/apple-touch-icon.png',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }],
            },
            {
                source: '/robots.txt',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
            },
            {
                source: '/sitemap.xml',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
            },
        ];
    },
};

export default nextConfig;