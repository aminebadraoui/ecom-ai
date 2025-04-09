import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getWorkflows, createWorkflow } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        if (user.id) {
            // Use supabaseAdmin to bypass RLS
            const { data: workflows, error } = await supabaseAdmin
                .from('workflows')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching workflows:', error);
                return NextResponse.json(
                    { error: 'Failed to fetch workflows' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ workflows });
        }

        return user; // This is the unauthorized response from requireAuth
    } catch (error) {
        console.error('Error fetching workflows:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflows' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const user = await requireAuth(request);

        if (!user.id) {
            return user; // This is the unauthorized response from requireAuth
        }

        const body = await request.json();

        // Use supabaseAdmin to bypass RLS
        const { data: workflow, error } = await supabaseAdmin
            .from('workflows')
            .insert({
                user_id: user.id,
                name: body.name || `Workflow ${new Date().toLocaleDateString()}`,
                ads: body.ads || []
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating workflow:', error);
            return NextResponse.json(
                { error: 'Failed to create workflow' },
                { status: 500 }
            );
        }

        return NextResponse.json({ workflow });
    } catch (error) {
        console.error('Error creating workflow:', error);
        return NextResponse.json(
            { error: 'Failed to create workflow' },
            { status: 500 }
        );
    }
} 