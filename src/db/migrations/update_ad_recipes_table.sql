-- Update ad_recipes table to match our implementation
ALTER TABLE public.ad_recipes
    -- Rename prompt_json to content
    RENAME COLUMN prompt_json TO content;

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ad_recipes' AND column_name = 'status') THEN
        ALTER TABLE public.ad_recipes ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';
    END IF;

    -- Add ad_archive_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ad_recipes' AND column_name = 'ad_archive_id') THEN
        ALTER TABLE public.ad_recipes ADD COLUMN ad_archive_id TEXT;
    END IF;

    -- Add ad_image_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ad_recipes' AND column_name = 'ad_image_url') THEN
        ALTER TABLE public.ad_recipes ADD COLUMN ad_image_url TEXT;
    END IF;
END $$;

-- Drop unnecessary columns
ALTER TABLE public.ad_recipes 
    DROP COLUMN IF EXISTS is_generated,
    DROP COLUMN IF EXISTS ad_concept_ids;

-- Update existing recipes if needed
UPDATE public.ad_recipes
SET status = 'completed'
WHERE status IS NULL; 