import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getUser } from '../../../lib/auth';
import { cookies } from 'next/headers';
import { RequestInit } from 'node-fetch';
import { Database } from '@/lib/database.types';

// Type definition for external API response
interface ExternalApiResponse {
    task_id: string;
    status: string;
    [key: string]: any; // Allow for additional properties
}

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

        // Call external API
        const externalApiUrl = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'http://localhost:3006';
        console.log('External API Configuration:', {
            NEXT_PUBLIC_EXTERNAL_API_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_URL,
            using: externalApiUrl,
            fullUrl: `${externalApiUrl}/api/v1/extract-ad-concept`,
            NODE_ENV: process.env.NODE_ENV
        });

        try {
            console.log('Attempting to fetch from external API...');
            console.log('Request body:', {
                image_url,
                type: 'ad_concept'
            });

            // Add timeout handling
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
                console.error('Fetch operation timed out after 30 seconds');
            }, 30000);

            console.log('Starting fetch operation to:', `${externalApiUrl}/api/v1/extract-ad-concept`);

            try {
                const response = await fetch(`${externalApiUrl}/api/v1/extract-ad-concept`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        image_url,
                        type: 'ad_concept'
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                console.log('Fetch completed with status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('External API error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        headers: Object.fromEntries(response.headers)
                    });
                    return NextResponse.json(
                        { error: `External API error: ${response.statusText}. ${errorText}` },
                        { status: response.status }
                    );
                }

                const responseData = await response.json() as ExternalApiResponse;
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
            } catch (fetchError: any) {
                clearTimeout(timeout);
                console.error('Fetch operation failed with error:', {
                    name: fetchError?.name,
                    message: fetchError?.message,
                    cause: fetchError?.cause,
                    stack: fetchError?.stack?.split('\n').slice(0, 3)
                });

                if (fetchError?.name === 'AbortError') {
                    return NextResponse.json(
                        { error: 'Request to external API timed out after 30 seconds' },
                        { status: 504 }  // Gateway Timeout
                    );
                }

                return NextResponse.json(
                    { error: `Failed to connect to external API: ${fetchError?.message}` },
                    { status: 502 }  // Bad Gateway
                );
            }
        } catch (err: any) {
            console.error('Error in concept generation:', err);
            return NextResponse.json(
                { error: err?.message || 'Internal server error' },
                { status: 500 }
            );
        }
    } catch (err: any) {
        console.error('Error in concept generation:', err);
        return NextResponse.json(
            { error: err?.message || 'Internal server error' },
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
                const externalApiUrl = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'http://localhost:3006';
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