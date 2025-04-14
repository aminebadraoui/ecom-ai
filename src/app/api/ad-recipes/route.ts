import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

// GET /api/ad-recipes - Get all ad recipes directly from Supabase
export async function GET(request: Request) {
    try {
        // Authenticate the user
        const user = await requireAuth();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all recipes
        const { data: recipes, error } = await supabaseAdmin
            .from('ad_recipes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching ad recipes:', error);
            return NextResponse.json(
                { error: 'Failed to fetch ad recipes' },
                { status: 500 }
            );
        }

        return NextResponse.json({ recipes });
    } catch (error) {
        console.error('Error in GET /api/ad-recipes:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 