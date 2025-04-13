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
    experimental: {
        allowedRevalidateHeaderKeys: ['*'],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.EXTERNAL_API_URL + '/api/:path*',
            },
        ];
    },
}

module.exports = nextConfig 