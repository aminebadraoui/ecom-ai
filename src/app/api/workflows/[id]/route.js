import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper to check workflow ownership
async function checkWorkflowOwnership(workflowId, userId) {
    const { data, error } = await supabaseAdmin
        .from('workflows')
        .select('user_id')
        .eq('id', workflowId)
        .single();

    if (error || !data) {
        return false;
    }

    return data.user_id === userId;
}

export async function GET(request, { params }) {
    try {
        const user = await requireAuth(request);

        if (!user.id) {
            return user; // This is the unauthorized response from requireAuth
        }

        const { id } = params;

        // Verify ownership
        const isOwner = await checkWorkflowOwnership(id, user.id);
        if (!isOwner) {
            return NextResponse.json(
                { error: 'Not authorized to access this workflow' },
                { status: 403 }
            );
        }

        // Use supabaseAdmin to bypass RLS
        const { data: workflow, error } = await supabaseAdmin
            .from('workflows')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching workflow:', error);
            return NextResponse.json(
                { error: 'Failed to fetch workflow' },
                { status: 500 }
            );
        }

        return NextResponse.json({ workflow });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const user = await requireAuth(request);

        if (!user.id) {
            return user; // This is the unauthorized response from requireAuth
        }

        const { id } = params;

        // Verify ownership
        const isOwner = await checkWorkflowOwnership(id, user.id);
        if (!isOwner) {
            return NextResponse.json(
                { error: 'Not authorized to update this workflow' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Use supabaseAdmin to bypass RLS
        const { data: workflow, error } = await supabaseAdmin
            .from('workflows')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating workflow:', error);
            return NextResponse.json(
                { error: 'Failed to update workflow' },
                { status: 500 }
            );
        }

        return NextResponse.json({ workflow });
    } catch (error) {
        console.error('Error updating workflow:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await requireAuth(request);

        if (!user.id) {
            return user; // This is the unauthorized response from requireAuth
        }

        const { id } = params;

        // Verify ownership
        const isOwner = await checkWorkflowOwnership(id, user.id);
        if (!isOwner) {
            return NextResponse.json(
                { error: 'Not authorized to delete this workflow' },
                { status: 403 }
            );
        }

        // Use supabaseAdmin to bypass RLS
        const { error } = await supabaseAdmin
            .from('workflows')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting workflow:', error);
            return NextResponse.json(
                { error: 'Failed to delete workflow' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        return NextResponse.json(
            { error: 'Failed to delete workflow' },
            { status: 500 }
        );
    }
} 