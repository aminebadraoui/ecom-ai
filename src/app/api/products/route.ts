import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
    try {
        const user = await requireAuth(request);

        if (!user.id) {
            return user; // This is the unauthorized response from requireAuth
        }

        console.log('Fetching mock products for user:', user.id);

        // Create mock products
        const products = [
            {
                id: uuidv4(),
                name: 'Eye Renewal Serum',
                description: 'Advanced formula for reducing dark circles and rejuvenating the eye area.',
                price: 39.99,
                image_url: 'https://example.com/images/eye-serum.jpg',
                created_at: new Date().toISOString()
            },
            {
                id: uuidv4(),
                name: 'Complete Skin Care Kit',
                description: 'Full regimen of facial products for all skin types.',
                price: 89.99,
                image_url: 'https://example.com/images/skincare-kit.jpg',
                created_at: new Date().toISOString()
            }
        ];

        // Log the products for debugging
        console.log('Returning mock products:', products);

        return NextResponse.json({
            products: products,
            success: true
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products', products: [] },
            { status: 500 }
        );
    }
}

async function getAllProducts(userId: string) {
    try {
        // Fetch user's products
        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            // If the table doesn't exist, return an empty array
            if (error.code === '42P01') {
                return NextResponse.json({ products: [] });
            }

            console.error('Error fetching products:', error);
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        return NextResponse.json({ products });
    } catch (dbError) {
        console.error('Database error:', dbError);
        // Return empty array in case of database error
        return NextResponse.json({ products: [] });
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

        if (!body.sales_url) {
            return NextResponse.json(
                { error: 'Sales URL is required' },
                { status: 400 }
            );
        }

        // In a real implementation, this would make a call to GPT for sales page analysis
        // For now, we'll simulate the response with mock data

        // Generate mock product details
        const productDetails = {
            product_name: body.name || `Product ${new Date().toLocaleDateString()}`,
            tagline: "Restore Your Youthful Appearance In 90 Days Or It's FREE",
            key_benefits: [
                "Activates natural collagen production",
                "Restores skin's youthful firmness",
                "Reverses visible signs of aging",
                "Strengthens skin's protective barrier"
            ],
            features: [
                "Breakthrough transdermal technology for maximum absorption",
                "Delivers a powerful blend of skin-rejuvenating nutrients",
                "Formulated by leading skincare researchers and anti-aging specialists",
                "Offers a non-invasive alternative to expensive treatments"
            ],
            problem_addressed: "Struggles with deep wrinkles, sagging skin, and lost radiance, and the ineffectiveness or inconvenience of traditional anti-aging solutions.",
            target_audience: "Busy women over 50 seeking effective and convenient anti-aging solutions.",
            social_proof: {
                testimonials: [],
                media_mentions: [],
                sales_numbers: "Over 129,000 patches sold"
            },
            offer: {
                discount: "50% off",
                limited_time_offer: "Today only",
                shipping: "Free USA shipping",
                guarantee: "90-day money-back guarantee"
            },
            call_to_action: "Get 50% Off Today Only",
            visual_elements_to_include: [
                "Images demonstrating the application of the patch",
                "Before and after photos showcasing results",
                "Icons representing key benefits (e.g., collagen activation, skin firmness)",
                "Trust badges for money-back guarantee and free shipping"
            ],
            brand_voice: "Professional, trustworthy, and empowering, emphasizing scientific innovation and customer satisfaction.",
            compliance_notes: "Ensure that all claims about product efficacy and comparisons to other treatments are substantiated and comply with Facebook's advertising policies."
        };

        try {
            // Store the product in the database
            const { data: product, error } = await supabaseAdmin
                .from('products')
                .insert({
                    user_id: user.id,
                    name: body.name || productDetails.product_name,
                    sales_url: body.sales_url,
                    details_json: productDetails,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                // If the table doesn't exist, create a mock response
                if (error.code === '42P01') {
                    const mockProduct = {
                        id: `temp-${Date.now()}`,
                        user_id: user.id,
                        name: body.name || productDetails.product_name,
                        sales_url: body.sales_url,
                        details_json: productDetails,
                        created_at: new Date().toISOString()
                    };
                    return NextResponse.json({
                        success: true,
                        product: mockProduct
                    });
                }

                console.error('Error creating product:', error);
                return NextResponse.json(
                    { error: 'Failed to create product' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                product
            });
        } catch (dbError) {
            console.error('Database error:', dbError);

            // Return a mock product in case of database error
            const mockProduct = {
                id: `temp-${Date.now()}`,
                user_id: user.id,
                name: body.name || productDetails.product_name,
                sales_url: body.sales_url,
                details_json: productDetails,
                created_at: new Date().toISOString()
            };

            return NextResponse.json({
                success: true,
                product: mockProduct
            });
        }
    } catch (error) {
        console.error('Error in products route:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An error occurred',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
} 