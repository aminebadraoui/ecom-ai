import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            // This is the unauthorized response from requireAuth
            return user;
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: 'Concept ID is required' },
                { status: 400 }
            );
        }

        try {
            // Query to fetch a specific concept
            const { data: concept, error } = await supabaseAdmin
                .from('ad_concepts')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            if (error) {
                // If the table doesn't exist, return an error
                if (error.code === '42P01') {
                    return NextResponse.json(
                        { error: 'Concept data is not available' },
                        { status: 404 }
                    );
                }

                console.error('Error fetching concept:', error);
                return NextResponse.json(
                    { error: 'Failed to fetch concept' },
                    { status: 500 }
                );
            }

            if (!concept) {
                return NextResponse.json(
                    { error: 'Concept not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ concept });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to fetch concept due to database error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error fetching concept:', error);
        return NextResponse.json(
            { error: 'Failed to fetch concept' },
            { status: 500 }
        );
    }
} 