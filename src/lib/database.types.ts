export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            ad_concepts: {
                Row: {
                    id: string
                    user_id: string
                    ad_archive_id: string
                    task_id: string
                    status: 'pending' | 'processing' | 'completed' | 'failed'
                    concept_json: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    ad_archive_id: string
                    task_id: string
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    concept_json?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    ad_archive_id?: string
                    task_id?: string
                    status?: 'pending' | 'processing' | 'completed' | 'failed'
                    concept_json?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
} 