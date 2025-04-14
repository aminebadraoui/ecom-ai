import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

// GET /api/products - Get all products for the user
export async function GET() {
    try {
        const user = await requireAuth();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Error in GET /api/products:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        if (!body.name || !body.sales_url) {
            return NextResponse.json(
                { error: 'Name and sales_url are required' },
                { status: 400 }
            );
        }

        const product = {
            id: uuidv4(),
            user_id: user.id,
            name: body.name,
            sales_url: body.sales_url,
            details_json: body.details_json || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            return NextResponse.json(
                { error: 'Failed to create product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Error in POST /api/products:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 