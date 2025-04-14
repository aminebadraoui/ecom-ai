/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.fbcdn.net',
                pathname: '**',
            }
        ],
    },
    // Allow API routes to make HTTP requests to external API
    experimental: {
        allowMiddlewareResponseBody: true,
        serverComponentsExternalPackages: ['node-fetch'],
    },
    // Set Content Security Policy to allow connections to external API
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; connect-src 'self' http://146.190.42.147:3006 ws: wss:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:;",
                    },
                ],
            },
        ];
    },
    // Explicitly set Node.js runtime for API routes
    serverRuntimeConfig: {
        PROJECT_ROOT: __dirname,
    },
}

module.exports = nextConfig 