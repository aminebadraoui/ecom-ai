import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    response.cookies.set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        path: '/',
        expires: new Date(0),
        sameSite: 'lax'
    });

    return response;
} 