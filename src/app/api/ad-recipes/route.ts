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

        console.log('Ad recipes API - authenticated user:', user.id, user.email);

        // Fetch all recipes - temporarily removing user_id filter for debugging
        const { data: recipes, error } = await supabaseAdmin
            .from('ad_recipes')
            .select('*')
            // Commenting out the user filter to see if recipes exist
            // .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching ad recipes:', error);
            return NextResponse.json(
                { error: 'Failed to fetch ad recipes' },
                { status: 500 }
            );
        }

        console.log('Ad recipes API - found recipes:', recipes?.length);

        if (recipes && recipes.length > 0) {
            // Log the first recipe's user_id to check if it matches
            console.log('First recipe user_id:', recipes[0].user_id, 'Current user_id:', user.id);
            console.log('Recipe creation dates:', recipes.map(r => r.created_at).join(', '));
        }

        // Add cache control headers to prevent caching
        const response = NextResponse.json({
            recipes,
            timestamp: new Date().toISOString(),
            debug: {
                currentUserId: user.id,
                recipeCount: recipes?.length || 0
            }
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    } catch (error) {
        console.error('Error in GET /api/ad-recipes:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 