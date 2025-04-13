import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';

export const createWorkflow = async (userId, data) => {
    const { data: workflow, error } = await supabaseAdmin
        .from('workflows')
        .insert({
            user_id: userId,
            name: data.name || `Workflow ${new Date().toLocaleDateString()}`,
            created_at: new Date().toISOString(),
            ads: data.ads || [],
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating workflow:', error);
        throw new Error('Failed to create workflow');
    }

    return workflow;
};

export const getWorkflows = async (userId) => {
    console.log('getWorkflows called with userId:', userId);

    // Use admin client to bypass RLS
    const query = supabaseAdmin
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    console.log('Query URL:', query.url);
    console.log('Query parameters:', query.params);

    const { data: workflows, error } = await query;

    console.log('Supabase response:', { workflows, error });

    if (error) {
        console.error('Error fetching workflows:', error);
        throw new Error('Failed to fetch workflows');
    }

    return workflows;
};

export const getWorkflow = async (id) => {
    console.log('Fetching workflow:', id);

    // First, get the workflow
    const { data: workflow, error } = await supabaseAdmin
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching workflow:', error);
        throw new Error('Failed to fetch workflow');
    }

    console.log('Workflow data:', workflow);

    if (!workflow || !workflow.ads || workflow.ads.length === 0) {
        console.log('No ads in workflow, returning early');
        return workflow;
    }

    // Get all ad_archive_ids from the workflow's ads
    const adArchiveIds = workflow.ads.map(ad => ad.ad_archive_id);
    console.log('Fetching concepts for ad_archive_ids:', adArchiveIds);

    // Fetch concepts for all ads in one query
    const { data: concepts, error: conceptsError } = await supabaseAdmin
        .from('ad_concepts')
        .select('*')
        .in('ad_archive_id', adArchiveIds);

    if (conceptsError) {
        console.error('Error fetching concepts:', conceptsError);
        throw new Error('Failed to fetch concepts');
    }

    console.log('Found concepts:', concepts);

    // Map concepts to their respective ads
    const adsWithConcepts = workflow.ads.map(ad => {
        const concept = concepts?.find(c => c.ad_archive_id === ad.ad_archive_id);
        console.log(`Mapping concept for ad ${ad.ad_archive_id}:`, concept);
        return concept ? {
            ...ad,
            concept: {
                id: concept.id,
                task_id: concept.task_id,
                status: concept.status,
                concept_json: concept.concept_json,
                error: concept.error
            }
        } : ad;
    });

    // Return workflow with updated ads
    const result = {
        ...workflow,
        ads: adsWithConcepts
    };
    console.log('Returning workflow with concepts:', result);
    return result;
};

export const updateWorkflow = async (id, data) => {
    const { data: workflow, error } = await supabaseAdmin
        .from('workflows')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating workflow:', error);
        throw new Error('Failed to update workflow');
    }

    return workflow;
};

export const deleteWorkflow = async (id) => {
    const { error } = await supabaseAdmin
        .from('workflows')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting workflow:', error);
        throw new Error('Failed to delete workflow');
    }

    return true;
}; 