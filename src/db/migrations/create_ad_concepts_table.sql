-- Drop existing table if it exists
DROP TABLE IF EXISTS public.ad_concepts;

-- Create ad_concepts table with task_id included
CREATE TABLE IF NOT EXISTS public.ad_concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ad_archive_id TEXT NOT NULL,
    page_name TEXT,
    concept_json JSONB NOT NULL,
    task_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, ad_archive_id)
);

-- Add RLS policies for ad_concepts
ALTER TABLE public.ad_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_concepts_select_policy ON public.ad_concepts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ad_concepts_insert_policy ON public.ad_concepts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ad_concepts_update_policy ON public.ad_concepts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY ad_concepts_delete_policy ON public.ad_concepts
    FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS ad_concepts_user_id_idx ON public.ad_concepts(user_id);
CREATE INDEX IF NOT EXISTS ad_concepts_ad_archive_id_idx ON public.ad_concepts(ad_archive_id);
CREATE INDEX IF NOT EXISTS ad_concepts_task_id_idx ON public.ad_concepts(task_id); 