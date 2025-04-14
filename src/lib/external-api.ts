import axios from 'axios';

// Create a configured instance of axios
const apiClient = axios.create({
    timeout: 60000, // 60 second timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`External API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data
        });
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for logging
apiClient.interceptors.response.use(
    (response) => {
        console.log(`External API Response: ${response.status}`, {
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    (error) => {
        console.error('Response Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
            code: error.code
        });
        return Promise.reject(error);
    }
);

export async function callExternalApi<T>(endpoint: string, data: any): Promise<T> {
    const externalApiUrl = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'http://localhost:3006';
    const url = `${externalApiUrl}${endpoint}`;

    console.log('Calling external API:', {
        url,
        NEXT_PUBLIC_EXTERNAL_API_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_URL,
        NODE_ENV: process.env.NODE_ENV
    });

    try {
        const response = await apiClient.post<T>(url, data);
        return response.data;
    } catch (error: any) {
        console.error('External API call failed:', {
            url,
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
}

export default apiClient; 