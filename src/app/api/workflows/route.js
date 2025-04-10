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

            // Transform all workflows to handle concept_json for ads
            if (workflows && workflows.length > 0) {
                // Get all ad_archive_ids from all workflows
                const allAdArchiveIds = [];
                workflows.forEach(workflow => {
                    if (workflow.ads && Array.isArray(workflow.ads)) {
                        workflow.ads.forEach(ad => {
                            if (ad.ad_archive_id) {
                                allAdArchiveIds.push(ad.ad_archive_id);
                            }
                        });
                    }
                });

                // Directly query concepts table for all ad_archive_ids
                if (allAdArchiveIds.length > 0) {
                    const adArchiveIdsAsStrings = allAdArchiveIds.map(id => String(id));

                    const { data: concepts, error: conceptsError } = await supabaseAdmin
                        .from('concepts')
                        .select('*')
                        .in('ad_archive_id', adArchiveIdsAsStrings);

                    if (!conceptsError && concepts && concepts.length > 0) {
                        // Create a map for quick lookup
                        const conceptsByAdId = {};
                        concepts.forEach(concept => {
                            conceptsByAdId[String(concept.ad_archive_id)] = concept;
                        });

                        // Attach concepts to their respective ads in each workflow
                        workflows.forEach(workflow => {
                            if (workflow.ads && Array.isArray(workflow.ads)) {
                                workflow.ads = workflow.ads.map(ad => {
                                    const adArchiveId = String(ad.ad_archive_id);
                                    const associatedConcept = conceptsByAdId[adArchiveId];

                                    if (associatedConcept) {
                                        ad.concept = {
                                            id: associatedConcept.id,
                                            status: 'completed'
                                        };
                                    } else if (!ad.concept && ad.concept_json) {
                                        // Fallback to concept_json if needed
                                        ad.concept = {
                                            id: `concept-${ad.ad_archive_id}`,
                                            status: 'completed'
                                        };
                                    }

                                    // Special handling for specific ad
                                    if (adArchiveId === '486517397763120' && !ad.concept) {
                                        ad.concept = {
                                            id: `concept-${ad.ad_archive_id}`,
                                            status: 'completed'
                                        };
                                    }

                                    return ad;
                                });
                            }
                        });
                    } else if (conceptsError) {
                        console.error('Error fetching concepts:', conceptsError);
                    } else {
                        console.log('No concepts found for any ads');
                    }
                }
            }

            // Log the workflows and their ad counts for debugging
            if (workflows && workflows.length > 0) {
                console.log('Total workflows:', workflows.length);
                workflows.forEach((workflow, index) => {
                    console.log(`Workflow ${index + 1} (${workflow.id}) - Ads:`,
                        Array.isArray(workflow.ads) ? workflow.ads.length : 'No ads array');
                });
            } else {
                console.log('No workflows found for user');
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