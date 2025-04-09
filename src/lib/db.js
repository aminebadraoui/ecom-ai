import { supabase } from './supabase';

export const createWorkflow = async (userId, data) => {
    const { data: workflow, error } = await supabase
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
    const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching workflows:', error);
        throw new Error('Failed to fetch workflows');
    }

    return workflows;
};

export const getWorkflow = async (id) => {
    const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching workflow:', error);
        throw new Error('Failed to fetch workflow');
    }

    return workflow;
};

export const updateWorkflow = async (id, data) => {
    const { data: workflow, error } = await supabase
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
    const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting workflow:', error);
        throw new Error('Failed to delete workflow');
    }

    return true;
}; 