import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    try {
        // Check if environment variables are set
        const envCheck = {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            JWT_SECRET: !!process.env.JWT_SECRET,
            NODE_ENV: process.env.NODE_ENV
        };

        // Check auth cookie
        const cookieStore = cookies();
        const authCookie = cookieStore.get('auth_token');

        let tokenInfo = null;
        if (authCookie?.value) {
            try {
                tokenInfo = {
                    valid: !!verifyToken(authCookie.value),
                    length: authCookie.value.length
                };
            } catch (error) {
                tokenInfo = {
                    valid: false,
                    error: error.message
                };
            }
        }

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            envCheck,
            cookie: {
                exists: !!authCookie,
                tokenInfo
            }
        });
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
} 