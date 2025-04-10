import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            // This is the unauthorized response from requireAuth
            return user;
        }

        const body = await request.json();

        if (!body.adIds || !Array.isArray(body.adIds) || body.adIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: adIds is required and must be a non-empty array' },
                { status: 400 }
            );
        }

        // Fetch the referenced ads from the workflows table
        const { data: workflows, error: workflowsError } = await supabaseAdmin
            .from('workflows')
            .select('ads')
            .eq('user_id', user.id);

        if (workflowsError) {
            console.error('Error fetching workflows:', workflowsError);
            return NextResponse.json(
                { error: 'Failed to fetch workflows' },
                { status: 500 }
            );
        }

        // Extract all ads from all workflows
        const allAds = workflows.flatMap(workflow => workflow.ads || []);

        // Filter to only the requested ads
        const selectedAds = allAds.filter(ad => body.adIds.includes(ad.ad_archive_id));

        if (selectedAds.length === 0) {
            return NextResponse.json(
                { error: 'No matching ads found' },
                { status: 404 }
            );
        }

        console.log(`Found ${selectedAds.length} matching ads out of ${allAds.length} total ads`);
        selectedAds.forEach(ad => console.log(`Selected ad: ${ad.ad_archive_id} - ${ad.page_name}`));

        // In a real implementation, this would make calls to the GPT API for analysis
        // For now, we'll simulate the response with mock data - one concept per ad
        interface ConceptData {
            ad_archive_id: string;
            page_name: string;
            concept_data: {
                layout: {
                    primaryElement: string;
                    components: Array<{
                        type: string;
                        position: string;
                        style: string;
                    }>;
                };
                messaging: {
                    tone: string;
                    approach: string;
                    keyElements: string[];
                };
                visualStyle: {
                    colorScheme: string;
                    imageType: string;
                    textOverlay: string;
                };
            };
            created_at: string;
        }

        // Generate exactly one concept per ad to simulate AI response
        const adConcepts: ConceptData[] = selectedAds.map(ad => ({
            ad_archive_id: ad.ad_archive_id,
            page_name: ad.page_name,
            concept_data: {
                layout: {
                    primaryElement: "image",
                    components: [
                        { type: "header", position: "top", style: "bold" },
                        { type: "image", position: "center", style: "fullwidth" },
                        { type: "testimonial", position: "below-image", style: "quoted" },
                        { type: "callToAction", position: "bottom", style: "button" }
                    ]
                },
                messaging: {
                    tone: "direct and persuasive",
                    approach: "problem-solution",
                    keyElements: [
                        "emotional hook",
                        "social proof",
                        "urgency",
                        "guarantee"
                    ]
                },
                visualStyle: {
                    colorScheme: "contrasting with emphasis on product",
                    imageType: "before/after demonstration",
                    textOverlay: "minimal but impactful"
                }
            },
            created_at: new Date().toISOString()
        }));

        console.log(`Generated ${adConcepts.length} concepts for ${selectedAds.length} ads`);

        try {
            // First check if any of these concepts already exist
            const { data: existingConcepts, error: checkError } = await supabaseAdmin
                .from('ad_concepts')
                .select('*')
                .in('ad_archive_id', adConcepts.map(c => c.ad_archive_id));

            if (checkError) {
                console.error('Error checking existing concepts:', checkError);
                // Continue with creation anyway
            }

            // Create a map of existing concepts by ad_archive_id
            const existingConceptsMap = new Map();
            (existingConcepts || []).forEach(concept => {
                existingConceptsMap.set(concept.ad_archive_id, concept);
            });

            // Filter out concepts that already exist
            const newConcepts = adConcepts.filter(c => !existingConceptsMap.has(c.ad_archive_id));

            let newConceptsData = [];

            // Only insert concepts that don't already exist
            if (newConcepts.length > 0) {
                const { data: insertedData, error: conceptsError } = await supabaseAdmin
                    .from('ad_concepts')
                    .upsert(
                        newConcepts.map(concept => ({
                            user_id: user.id,
                            ad_archive_id: concept.ad_archive_id,
                            page_name: concept.page_name,
                            concept_json: concept.concept_data,
                            created_at: new Date().toISOString()
                        })),
                        { onConflict: 'user_id,ad_archive_id', ignoreDuplicates: true }
                    )
                    .select();

                if (conceptsError) {
                    // Log the error but don't fail the request
                    console.error('Error storing ad concepts:', conceptsError);

                    // Handle foreign key constraint violations or table not existing
                    if (conceptsError.code === '23503' || conceptsError.code === '42P01') {
                        // Create temporary concepts for the new ones
                        newConceptsData = newConcepts.map((concept, index) => ({
                            id: `temp-${index}`,
                            user_id: user.id,
                            ad_archive_id: concept.ad_archive_id,
                            page_name: concept.page_name,
                            concept_json: concept.concept_data,
                            created_at: concept.created_at
                        }));
                    } else {
                        return NextResponse.json(
                            { error: 'Failed to store ad concepts' },
                            { status: 500 }
                        );
                    }
                } else {
                    newConceptsData = insertedData || [];
                }
            }

            // Return all concepts - make sure to only include unique concepts by ad_archive_id
            // Start with existing concepts, but ensure they have the expected structure
            const allConcepts = Array.from(existingConceptsMap.values()).map(concept => {
                // Check if the concept has the expected structure
                if (!concept.concept_json ||
                    !concept.concept_json.layout ||
                    !concept.concept_json.messaging ||
                    !concept.concept_json.visualStyle) {

                    // If not, replace with a properly structured concept
                    return {
                        ...concept,
                        concept_json: {
                            layout: {
                                primaryElement: "image",
                                components: [
                                    { type: "header", position: "top", style: "bold" },
                                    { type: "image", position: "center", style: "fullwidth" },
                                    { type: "testimonial", position: "below-image", style: "quoted" },
                                    { type: "callToAction", position: "bottom", style: "button" }
                                ]
                            },
                            messaging: {
                                tone: "direct and persuasive",
                                approach: "problem-solution",
                                keyElements: [
                                    "emotional hook",
                                    "social proof",
                                    "urgency",
                                    "guarantee"
                                ]
                            },
                            visualStyle: {
                                colorScheme: "contrasting with emphasis on product",
                                imageType: "before/after demonstration",
                                textOverlay: "minimal but impactful"
                            }
                        }
                    };
                }

                return concept;
            });

            // Add new concepts that don't already exist in the result
            for (const concept of newConceptsData) {
                if (!existingConceptsMap.has(concept.ad_archive_id)) {
                    allConcepts.push(concept);
                }
            }

            return NextResponse.json({
                success: true,
                concepts: allConcepts
            });
        } catch (dbError) {
            console.error('Database error:', dbError);

            // Return the concepts without storing them in case of database error
            return NextResponse.json({
                success: true,
                concepts: adConcepts.map((concept, index) => ({
                    id: `temp-${index}`,
                    user_id: user.id,
                    ad_archive_id: concept.ad_archive_id,
                    page_name: concept.page_name,
                    concept_json: concept.concept_data,
                    created_at: concept.created_at
                }))
            });
        }
    } catch (error) {
        console.error('Error in ad-concepts route:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An error occurred',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const user = await requireAuth(request);

        if (!user?.id) {
            // This is the unauthorized response from requireAuth
            return user;
        }

        const { searchParams } = new URL(request.url);
        const adIds = searchParams.get('adIds')?.split(',');

        console.log('GET ad concepts - Requested adIds:', adIds);

        try {
            // Query to fetch concepts
            let query = supabaseAdmin
                .from('ad_concepts')
                .select('*')
                .eq('user_id', user.id);

            // Filter by ad IDs if provided
            if (adIds && adIds.length > 0) {
                // Match by exact ad_archive_id
                query = query.in('ad_archive_id', adIds);
            }

            const { data: concepts, error } = await query.order('created_at', { ascending: false });

            if (error) {
                // If the table doesn't exist, return an empty array
                if (error.code === '42P01') {
                    return NextResponse.json({ concepts: [] });
                }

                console.error('Error fetching ad concepts:', error);
                return NextResponse.json(
                    { error: 'Failed to fetch ad concepts' },
                    { status: 500 }
                );
            }

            console.log(`GET ad concepts - Found ${concepts?.length || 0} concepts`);

            // No longer filtering for uniqueness - return all concepts
            // Ensure all concepts have the expected structure
            const structuredConcepts = (concepts || []).map(concept => {
                // Check if the concept has the expected structure
                if (!concept.concept_json ||
                    !concept.concept_json.layout ||
                    !concept.concept_json.messaging ||
                    !concept.concept_json.visualStyle) {

                    // If not, replace with a properly structured concept
                    return {
                        ...concept,
                        concept_json: {
                            layout: {
                                primaryElement: "image",
                                components: [
                                    { type: "header", position: "top", style: "bold" },
                                    { type: "image", position: "center", style: "fullwidth" },
                                    { type: "testimonial", position: "below-image", style: "quoted" },
                                    { type: "callToAction", position: "bottom", style: "button" }
                                ]
                            },
                            messaging: {
                                tone: "direct and persuasive",
                                approach: "problem-solution",
                                keyElements: [
                                    "emotional hook",
                                    "social proof",
                                    "urgency",
                                    "guarantee"
                                ]
                            },
                            visualStyle: {
                                colorScheme: "contrasting with emphasis on product",
                                imageType: "before/after demonstration",
                                textOverlay: "minimal but impactful"
                            }
                        }
                    };
                }

                return concept;
            });

            return NextResponse.json({ concepts: structuredConcepts });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Return empty array in case of database error
            return NextResponse.json({ concepts: [] });
        }
    } catch (error) {
        console.error('Error fetching ad concepts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ad concepts' },
            { status: 500 }
        );
    }
} 