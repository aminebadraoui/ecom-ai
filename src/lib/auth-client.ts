import { supabase } from './supabase';

/**
 * Get the currently authenticated user ID using all available methods
 * First tries client-side Supabase, then falls back to the server API
 */
export async function getUserId(): Promise<string> {
    try {
        // First try client-side Supabase
        const { data } = await supabase.auth.getUser();

        if (data.user && data.user.id) {
            return data.user.id;
        }

        // If that fails, try the server API
        const response = await fetch('/api/auth/user');

        if (!response.ok) {
            throw new Error('Failed to get user from API');
        }

        const userData = await response.json();

        if (userData.user && userData.user.id) {
            return userData.user.id;
        }

        throw new Error('User not authenticated');
    } catch (error) {
        console.error('Error getting user ID:', error);
        throw new Error('Authentication failed. Please try logging out and back in.');
    }
} 