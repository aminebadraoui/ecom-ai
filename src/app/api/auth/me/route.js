import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
    try {
        const userData = await getUser();

        if (!userData) {
            return NextResponse.json({ user: null });
        }

        // Get fresh user data from database using admin client to bypass RLS
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, created_at')
            .eq('id', userData.id)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error getting current user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 