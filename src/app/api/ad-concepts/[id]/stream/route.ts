import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const conceptId = params.id;
    console.log('SSE connection requested for concept:', conceptId);

    // Get the concept from Supabase
    const { data: concept, error } = await supabaseAdmin
        .from('ad_concepts')
        .select('*')
        .eq('id', conceptId)
        .single();

    if (error || !concept) {
        console.error('Error fetching concept:', error);
        return NextResponse.json(
            { error: 'Concept not found' },
            { status: 404 }
        );
    }

    console.log('Found concept:', concept);

    // Set up SSE headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Connection', 'keep-alive');

    let encoder = new TextEncoder();
    let isStreamClosed = false;

    let stream = new ReadableStream({
        async start(controller) {
            console.log('Starting SSE stream for concept:', conceptId);

            // Helper function to safely enqueue data
            const safeEnqueue = (data: string) => {
                if (!isStreamClosed) {
                    try {
                        controller.enqueue(encoder.encode(data));
                    } catch (err) {
                        console.warn('Failed to enqueue data:', err);
                    }
                }
            };

            // Helper function to update Supabase
            const updateSupabase = async (status: string, data: any = null, error: string | null = null) => {
                try {
                    const updateData: any = {
                        status,
                        updated_at: new Date().toISOString()
                    };

                    if (data) {
                        updateData.concept_json = data;
                    }

                    const { error: updateError } = await supabaseAdmin
                        .from('ad_concepts')
                        .update(updateData)
                        .eq('id', conceptId);

                    if (updateError) {
                        console.error('Error updating concept:', updateError);
                    } else {
                        console.log('Successfully updated concept in Supabase');
                    }
                } catch (err) {
                    console.error('Error updating Supabase:', err);
                }
            };

            try {
                // Connect to external API's SSE endpoint
                const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3006';
                console.log('External API SSE Configuration:', {
                    EXTERNAL_API_URL: process.env.EXTERNAL_API_URL,
                    NEXT_PUBLIC_EXTERNAL_API_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_URL,
                    using: externalApiUrl,
                    fullUrl: `${externalApiUrl}/api/v1/tasks/${concept.task_id}/stream`,
                    conceptId,
                    taskId: concept.task_id
                });

                const response = await fetch(`${externalApiUrl}/api/v1/tasks/${concept.task_id}/stream`);
                console.log('SSE connection response:', {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });

                if (!response.ok) {
                    throw new Error(`Failed to connect to task stream: ${response.status} ${response.statusText}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('No reader available');
                }

                while (!isStreamClosed) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('External API stream closed');
                        break;
                    }

                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        if (isStreamClosed) break;

                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                console.log('Received data from external API:', data);

                                // Update Supabase if the status is final
                                if (data.status === 'completed' || data.status === 'failed') {
                                    await updateSupabase(data.status, data.result, data.error);
                                }

                                // Send the update to the client
                                const event = `data: ${JSON.stringify({
                                    id: conceptId,
                                    task_id: concept.task_id,
                                    status: data.status,
                                    concept_json: data.result,
                                    error: data.error
                                })}\n\n`;
                                safeEnqueue(event);

                                // Close the stream if we receive a final status
                                if (data.status === 'completed' || data.status === 'failed') {
                                    isStreamClosed = true;
                                    break;
                                }
                            } catch (err) {
                                console.error('Error processing data:', err);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error in SSE stream:', err);

                // Update concept status to failed
                await updateSupabase('failed', null, err instanceof Error ? err.message : 'Unknown error');

                // Send error to client
                const event = `data: ${JSON.stringify({
                    id: conceptId,
                    task_id: concept.task_id,
                    status: 'failed',
                    error: err instanceof Error ? err.message : 'Unknown error'
                })}\n\n`;
                safeEnqueue(event);
            } finally {
                isStreamClosed = true;
                try {
                    controller.close();
                } catch (err) {
                    console.warn('Error closing controller:', err);
                }
            }
        }
    });

    return new Response(stream, {
        headers: responseHeaders
    });
} 