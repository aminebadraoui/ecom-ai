-- Create ad_concepts table
CREATE TABLE IF NOT EXISTS public.ad_concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ad_archive_id TEXT NOT NULL,
    page_name TEXT,
    concept_json JSONB NOT NULL,
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

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sales_url TEXT NOT NULL,
    details_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_policy ON public.products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY products_insert_policy ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY products_update_policy ON public.products
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY products_delete_policy ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- Create ad_recipes table
CREATE TABLE IF NOT EXISTS public.ad_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ad_concept_ids TEXT[] DEFAULT '{}',
    product_id UUID REFERENCES public.products(id),
    prompt_json JSONB NOT NULL,
    is_generated BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for ad_recipes
ALTER TABLE public.ad_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_recipes_select_policy ON public.ad_recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ad_recipes_insert_policy ON public.ad_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ad_recipes_update_policy ON public.ad_recipes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY ad_recipes_delete_policy ON public.ad_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS ad_concepts_user_id_idx ON public.ad_concepts(user_id);
CREATE INDEX IF NOT EXISTS ad_concepts_ad_archive_id_idx ON public.ad_concepts(ad_archive_id);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);
CREATE INDEX IF NOT EXISTS ad_recipes_user_id_idx ON public.ad_recipes(user_id);
CREATE INDEX IF NOT EXISTS ad_recipes_product_id_idx ON public.ad_recipes(product_id); 