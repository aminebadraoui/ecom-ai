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
        const { adIds } = body;

        if (!adIds || !Array.isArray(adIds) || adIds.length === 0) {
            return NextResponse.json(
                { error: 'Ad IDs are required' },
                { status: 400 }
            );
        }

        // Create concepts for all requested ads
        const concepts = [];

        for (const adId of adIds) {
            const conceptId = uuidv4();

            // Create the concept content
            const conceptContent = {
                headline: 'Amazing results with our product',
                description: 'Transform your experience with our revolutionary solution.',
                cta: 'Shop Now',
            };

            // Insert directly into the concepts table
            const { data, error } = await supabaseAdmin
                .from('concepts')
                .insert({
                    id: conceptId,
                    ad_archive_id: String(adId),
                    status: 'completed',
                    user_id: user.id,
                    content: conceptContent,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error(`Error creating concept for ad ${adId}:`, error);
                continue;
            }

            concepts.push({
                id: conceptId,
                ad_archive_id: adId,
                status: 'completed',
                content: conceptContent
            });
        }

        return NextResponse.json({
            concepts: concepts,
            success: true
        });
    } catch (error) {
        console.error('Error creating ad concepts:', error);
        return NextResponse.json(
            { error: 'Failed to create ad concepts' },
            { status: 500 }
        );
    }
} 