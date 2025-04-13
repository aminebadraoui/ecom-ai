import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            return user;
        }

        const workflow = await getWorkflow(params.id);

        if (!workflow) {
            return NextResponse.json(
                { error: 'Workflow not found' },
                { status: 404 }
            );
        }

        // Check if the workflow belongs to the user
        if (workflow.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({ workflow });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch workflow' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            return user;
        }

        const body = await request.json();
        const workflow = await getWorkflow(params.id);

        if (!workflow) {
            return NextResponse.json(
                { error: 'Workflow not found' },
                { status: 404 }
            );
        }

        // Check if the workflow belongs to the user
        if (workflow.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const updatedWorkflow = await updateWorkflow(params.id, {
            ...body,
            updated_at: new Date().toISOString()
        });

        return NextResponse.json({ workflow: updatedWorkflow });
    } catch (error) {
        console.error('Error updating workflow:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update workflow' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            return user;
        }

        const workflow = await getWorkflow(params.id);

        if (!workflow) {
            return NextResponse.json(
                { error: 'Workflow not found' },
                { status: 404 }
            );
        }

        // Check if the workflow belongs to the user
        if (workflow.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await deleteWorkflow(params.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete workflow' },
            { status: 500 }
        );
    }
} 