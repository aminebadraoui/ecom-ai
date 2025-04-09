import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Paths that don't require authentication
const publicPaths = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/me',
    '/api/debug',
    '/'
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path is public
    if (publicPaths.some(path => pathname.startsWith(path)) ||
        pathname.includes('/_next/') ||
        pathname.includes('/favicon.ico') ||
        pathname.includes('.')) {
        return NextResponse.next();
    }

    // Check for auth token
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        // Redirect to login if no token
        const url = new URL('/login', request.url);
        url.searchParams.set('redirect', encodeURIComponent(pathname));
        return NextResponse.redirect(url);
    }

    try {
        // Verify the token
        const decoded = verifyToken(token);

        if (!decoded) {
            throw new Error('Invalid token');
        }

        // Token is valid, proceed
        return NextResponse.next();
    } catch (error) {
        console.error('Token verification error:', error);

        // Clear the invalid token cookie
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set({
            name: 'auth_token',
            value: '',
            expires: new Date(0),
            path: '/',
            sameSite: 'lax'
        });

        // Redirect to login
        const url = new URL('/login', request.url);
        url.searchParams.set('redirect', encodeURIComponent(pathname));
        url.searchParams.set('error', 'session_expired');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 