-- Update products table to match our implementation
ALTER TABLE public.products
    -- Rename sales_url to url
    RENAME COLUMN sales_url TO url;

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE public.products ADD COLUMN description TEXT;
    END IF;

    -- Add price column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE public.products ADD COLUMN price TEXT;
    END IF;

    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Make details_json nullable
ALTER TABLE public.products ALTER COLUMN details_json DROP NOT NULL;

-- Update existing products to use the new structure
UPDATE public.products
SET 
    description = details_json->>'description',
    price = details_json->>'price',
    image_url = details_json->>'image_url'
WHERE 
    details_json IS NOT NULL AND 
    (description IS NULL OR price IS NULL); 