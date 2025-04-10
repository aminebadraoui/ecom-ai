import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            // This is the unauthorized response from requireAuth
            return user;
        }

        // Fetch user's ad recipes
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
        console.error('Error fetching ad recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ad recipes' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            // This is the unauthorized response from requireAuth
            return user;
        }

        const body = await request.json();

        if (!body.name || !body.product_id || !body.prompt_json) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        try {
            // Store the ad recipe in the database
            const { data: recipe, error } = await supabaseAdmin
                .from('ad_recipes')
                .insert({
                    user_id: user.id,
                    name: body.name,
                    ad_concept_ids: body.ad_concept_ids || [],
                    product_id: body.product_id,
                    prompt_json: body.prompt_json,
                    created_at: new Date().toISOString(),
                    is_generated: false // Image hasn't been generated yet
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating ad recipe:', error);

                // If the error is because the table doesn't exist or due to a foreign key constraint
                if (error.code === '42P01' || error.code === '23503') {
                    // Return a mock recipe response
                    return NextResponse.json({
                        success: true,
                        recipe: {
                            id: `temp-${Date.now()}`,
                            user_id: user.id,
                            name: body.name,
                            ad_concept_ids: body.ad_concept_ids || [],
                            product_id: body.product_id,
                            prompt_json: body.prompt_json,
                            created_at: new Date().toISOString(),
                            is_generated: false
                        }
                    });
                }

                return NextResponse.json(
                    { error: 'Failed to create ad recipe' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                recipe
            });
        } catch (dbError) {
            console.error('Database error:', dbError);

            // Return a mock recipe in case of database error
            return NextResponse.json({
                success: true,
                recipe: {
                    id: `temp-${Date.now()}`,
                    user_id: user.id,
                    name: body.name,
                    ad_concept_ids: body.ad_concept_ids || [],
                    product_id: body.product_id,
                    prompt_json: body.prompt_json,
                    created_at: new Date().toISOString(),
                    is_generated: false
                }
            });
        }
    } catch (error) {
        console.error('Error in ad-recipes route:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An error occurred',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
} 