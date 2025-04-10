import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request) {
    try {
        const user = await requireAuth(request);

        if (!user.id) {
            return user; // This is the unauthorized response from requireAuth
        }

        const body = await request.json();
        const { conceptIds, productId, name } = body;

        if (!conceptIds || !Array.isArray(conceptIds) || conceptIds.length === 0) {
            return NextResponse.json(
                { error: 'Concept IDs are required' },
                { status: 400 }
            );
        }

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        console.log(`Generating ad recipe for concepts: ${conceptIds.join(', ')} with product: ${productId}`);

        // Create recipe ID
        const recipeId = uuidv4();

        // Create recipe content
        const recipeContent = {
            headline: 'Amazing results guaranteed',
            description: 'Transform your experience with our revolutionary solution.',
            cta: 'Shop Now',
        };

        // Insert into the recipes table
        const { data: recipe, error } = await supabaseAdmin
            .from('ad_recipes')
            .insert({
                id: recipeId,
                name: name || 'New Ad Recipe',
                concept_ids: conceptIds,
                product_id: productId,
                status: 'completed',
                user_id: user.id,
                content: recipeContent,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating ad recipe:', error);
            return NextResponse.json(
                { error: 'Failed to insert ad recipe into database' },
                { status: 500 }
            );
        }

        console.log('Generated ad recipe:', JSON.stringify(recipe, null, 2));

        return NextResponse.json({
            recipe: {
                id: recipeId,
                name: name || 'New Ad Recipe',
                concept_ids: conceptIds,
                product_id: productId,
                status: 'completed',
                content: recipeContent
            },
            success: true
        });
    } catch (error) {
        console.error('Error creating ad recipe:', error);
        return NextResponse.json(
            { error: 'Failed to create ad recipe' },
            { status: 500 }
        );
    }
} 