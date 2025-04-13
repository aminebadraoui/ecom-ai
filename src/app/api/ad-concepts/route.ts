import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getUser } from '../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        console.log('Received POST request to /api/ad-concepts');
        const rawBody = await request.text();
        console.log('Raw request body:', rawBody);
        const body = JSON.parse(rawBody);
        console.log('Parsed request body:', body);
        const { ad_archive_id, image_url } = body;

        if (!ad_archive_id || !image_url) {
            console.log('Missing required fields:', { ad_archive_id, image_url });
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user from auth token in cookie
        const user = await getUser();
        console.log('User from cookie:', user);

        if (!user) {
            console.error('No authenticated user found');
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        const userId = user.id;
        console.log('User ID from cookie:', userId);

        console.log('Calling external API with image_url:', image_url);

        // Call external API
        const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3006';
        console.log('Using external API URL:', externalApiUrl);
        const response = await fetch(`${externalApiUrl}/api/v1/extract-ad-concept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url,
                type: 'ad_concept'
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            return NextResponse.json(
                { error: `External API error: ${response.statusText}. ${errorText}` },
                { status: response.status }
            );
        }

        const responseData = await response.json();
        console.log('External API response:', responseData);
        const { task_id } = responseData;

        // Create a new concept entry in Supabase
        const conceptId = uuidv4();
        console.log('Creating concept in Supabase:', {
            id: conceptId,
            user_id: userId,
            ad_archive_id,
            task_id,
            status: 'pending'
        });

        const { data: concept, error: insertError } = await supabaseAdmin
            .from('ad_concepts')
            .insert({
                id: conceptId,
                user_id: userId,
                ad_archive_id,
                task_id,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                concept_json: {}
            })
            .select()
            .single();

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create concept' },
                { status: 500 }
            );
        }

        console.log('Successfully created concept:', concept);

        // Return the concept ID and task ID for the frontend to connect to SSE
        const responsePayload = {
            id: conceptId,
            task_id: task_id,
            status: 'pending',
            sse_url: `/api/ad-concepts/${conceptId}/stream`
        };
        console.log('Returning response:', responsePayload);
        return NextResponse.json(responsePayload);
    } catch (err) {
        console.error('Error in concept generation:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const url = new URL(request.url);
        const conceptId = url.pathname.split('/').pop();
        const { concept_json, status } = await request.json();

        if (!conceptId) {
            return NextResponse.json(
                { error: 'Concept ID is required' },
                { status: 400 }
            );
        }

        // Update the concept in Supabase
        const { data: concept, error: updateError } = await supabaseAdmin
            .from('ad_concepts')
            .update({
                concept_json,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', conceptId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating concept:', updateError);
            return NextResponse.json(
                { error: 'Failed to update concept' },
                { status: 500 }
            );
        }

        return NextResponse.json(concept);
    } catch (err) {
        console.error('Error updating concept:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get concept status
export async function GET(request: Request) {
    const url = new URL(request.url);
    const conceptId = url.pathname.split('/').pop();

    if (!conceptId) {
        return NextResponse.json(
            { error: 'Concept ID is required' },
            { status: 400 }
        );
    }

    // Get the concept from Supabase
    const { data: concept, error } = await supabaseAdmin
        .from('ad_concepts')
        .select('*')
        .eq('id', conceptId)
        .single();

    if (error || !concept) {
        return NextResponse.json(
            { error: 'Concept not found' },
            { status: 404 }
        );
    }

    // Set up SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // First, send the initial state
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    id: conceptId,
                    task_id: concept.task_id,
                    status: concept.status,
                    concept_json: concept.concept_json
                })}\n\n`));

                // Connect to external API's SSE endpoint
                const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3006';
                const response = await fetch(`${externalApiUrl}/api/v1/tasks/${concept.task_id}/stream`);
                const reader = response.body?.getReader();

                if (!reader) {
                    throw new Error('No reader available');
                }

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    // Convert the chunk to text and parse it
                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            console.log('Received data from external API:', {
                                conceptId,
                                data
                            });

                            // Update the concept in Supabase
                            const { error: updateError } = await supabaseAdmin
                                .from('ad_concepts')
                                .update({
                                    concept_json: data,
                                    status: 'completed',
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', conceptId);

                            if (updateError) {
                                console.error('Error updating concept:', updateError);
                            } else {
                                console.log('Successfully updated concept status to completed');
                            }

                            // Send the update to the frontend
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                id: conceptId,
                                task_id: concept.task_id,
                                status: 'completed',
                                concept_json: data
                            })}\n\n`));
                        }
                    }
                }

                controller.close();
            } catch (err) {
                console.error('Error in SSE stream:', err);

                // Update concept status to failed
                const { error: updateError } = await supabaseAdmin
                    .from('ad_concepts')
                    .update({
                        status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', conceptId);

                if (updateError) {
                    console.error('Error updating concept status to failed:', updateError);
                } else {
                    console.log('Successfully updated concept status to failed');
                }

                // Send error to frontend
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    id: conceptId,
                    task_id: concept.task_id,
                    status: 'failed',
                    error: err instanceof Error ? err.message : 'Unknown error'
                })}\n\n`));

                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
} 