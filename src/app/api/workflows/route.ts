import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getWorkflows } from '@/lib/db';

export async function GET(request: Request) {
    try {
        console.log('Fetching workflows - start');
        const user = await requireAuth(request);
        console.log('User from auth:', user);

        if (!user?.id) {
            console.log('No user ID found');
            return user;
        }

        console.log('Fetching workflows for user:', user.id);
        const workflows = await getWorkflows(user.id);
        console.log('Fetched workflows:', workflows);

        return NextResponse.json({ workflows });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch workflows' },
            { status: 500 }
        );
    }
} 