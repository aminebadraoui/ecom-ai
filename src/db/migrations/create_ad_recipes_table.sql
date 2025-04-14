-- Create ad_recipes table
CREATE TABLE IF NOT EXISTS ad_recipes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ad_archive_id TEXT NOT NULL,
    ad_image_url TEXT,
    content JSONB,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ad_recipes_user_id_idx ON ad_recipes(user_id);
CREATE INDEX IF NOT EXISTS ad_recipes_product_id_idx ON ad_recipes(product_id);
CREATE INDEX IF NOT EXISTS ad_recipes_ad_archive_id_idx ON ad_recipes(ad_archive_id);

-- Add RLS policies
ALTER TABLE ad_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own ad recipes
CREATE POLICY ad_recipes_select_policy ON ad_recipes
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own ad recipes
CREATE POLICY ad_recipes_insert_policy ON ad_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own ad recipes
CREATE POLICY ad_recipes_update_policy ON ad_recipes
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own ad recipes
CREATE POLICY ad_recipes_delete_policy ON ad_recipes
    FOR DELETE USING (auth.uid() = user_id); 