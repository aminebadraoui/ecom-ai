-- Add task_id column to ad_concepts table
ALTER TABLE IF EXISTS public.ad_concepts 
ADD COLUMN IF NOT EXISTS task_id TEXT;

-- Add index on task_id for better performance
CREATE INDEX IF NOT EXISTS ad_concepts_task_id_idx ON public.ad_concepts(task_id);

-- Add status column if needed (to mirror the concepts table)
ALTER TABLE IF EXISTS public.ad_concepts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'; 