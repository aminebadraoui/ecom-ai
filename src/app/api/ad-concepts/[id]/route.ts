import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            return user;
        }

        console.log('Fetching concept:', params.id);

        const { data: concept, error } = await supabaseAdmin
            .from('ad_concepts')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
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

        // Check if the concept belongs to the user
        if (concept.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        console.log('Found concept:', concept);

        return NextResponse.json({ concept });
    } catch (err) {
        console.error('Error in GET /api/ad-concepts/[id]:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'An error occurred' },
            { status: 500 }
        );
    }
} 