/**
 * AdRemixer client-side API utils
 */

interface GenerateAdRecipeResponse {
    task_id: string;
    message: string;
}

interface AdRecipeTask {
    status: 'pending' | 'completed' | 'failed';
    result?: any;
    error?: string;
}

// Helper function to get the user's API token if available
async function getAuthHeader(): Promise<HeadersInit> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    try {
        // Try to get the access token from localStorage if available
        const token = localStorage.getItem('supabase.auth.token');
        if (token) {
            const parsedToken = JSON.parse(token);
            if (parsedToken?.access_token) {
                headers['Authorization'] = `Bearer ${parsedToken.access_token}`;
                return headers;
            }
        }

        // Fallback to the user's session
        const sessionStr = localStorage.getItem('supabase.auth.session');
        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
                return headers;
            }
        }
    } catch (err) {
        console.warn('Failed to get auth token:', err);
    }

    return headers;
}

/**
 * Generate an ad recipe through the external AdRemixer API
 */
export async function generateAdRecipe(
    adArchiveId: string,
    imageUrl: string,
    salesUrl: string,
    userId: string
): Promise<GenerateAdRecipeResponse> {
    const headers = await getAuthHeader();

    const response = await fetch('https://ai.adremixer.com/api/v1/generate-ad-recipe', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            ad_archive_id: adArchiveId,
            image_url: imageUrl,
            sales_url: salesUrl,
            user_id: userId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AdRemixer API error: ${errorData.error || response.statusText}`);
    }

    return await response.json();
}

/**
 * Subscribe to an ad recipe task stream
 */
export function subscribeToTaskStream(
    taskId: string,
    onUpdate: (data: AdRecipeTask) => void,
    onError: (error: Error) => void,
    onComplete: () => void
): () => void {
    const eventSource = new EventSource(`https://ai.adremixer.com/api/v1/tasks/${taskId}/stream`);

    eventSource.addEventListener('update', (event) => {
        try {
            const data = JSON.parse(event.data);
            onUpdate(data);

            // If the task is completed or failed, close the connection
            if (data.status === 'completed' || data.status === 'failed') {
                eventSource.close();
                onComplete();
            }
        } catch (err) {
            onError(err instanceof Error ? err : new Error(String(err)));
        }
    });

    eventSource.addEventListener('error', (event) => {
        onError(new Error('Error in SSE connection'));
        eventSource.close();
    });

    // Return a function to close the connection
    return () => {
        eventSource.close();
    };
}

/**
 * Poll task status (alternative to streaming)
 */
export async function checkTaskStatus(taskId: string): Promise<AdRecipeTask> {
    const headers = await getAuthHeader();

    const response = await fetch(`https://ai.adremixer.com/api/v1/tasks/${taskId}/status`, {
        headers
    });

    if (!response.ok) {
        throw new Error(`Failed to check task status: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Get task result
 */
export async function getTaskResult(taskId: string): Promise<any> {
    const headers = await getAuthHeader();

    const response = await fetch(`https://ai.adremixer.com/api/v1/tasks/${taskId}/result`, {
        headers
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch task result: ${response.statusText}`);
    }

    return await response.json();
} 