import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmpccarembmrmvyotvbf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    console.warn('Missing Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 