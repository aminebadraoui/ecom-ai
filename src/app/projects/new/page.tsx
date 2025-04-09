'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface Ad {
    ad_archive_id: string;
    start_date: number;
    url: string;
    snapshot: {
        body: {
            text: string | null;
        };
        cards: Array<{
            body: string | null;
            resized_image_url: string | null;
        }>;
        videos: Array<{
            video_preview_image_url: string | null;
            video_hd_url: string | null;
        }>;
    };
}

export default function NewProjectPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facebookAdUrl, setFacebookAdUrl] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check if user is authenticated
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                setIsAuthenticated(!!data.user);
            } catch (error) {
                console.error('Failed to check authentication status:', error);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isCheckingAuth && !isAuthenticated) {
            router.push('/login?redirect=/projects/new');
        }
    }, [isAuthenticated, isCheckingAuth, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facebookAdUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch ads');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to scrape ads');
            }

            // Navigate to the new workflow page
            router.push(`/projects/${data.workflow.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <p className="text-center">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Facebook Ad Library Search
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                            <p>Paste your Facebook Ad Library URL to scrape ads.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="mt-5">
                            <div>
                                <label htmlFor="facebookAdUrl" className="block text-sm font-medium text-gray-700">
                                    Facebook Ad Library URL
                                </label>
                                <input
                                    type="url"
                                    name="facebookAdUrl"
                                    id="facebookAdUrl"
                                    value={facebookAdUrl}
                                    onChange={(e) => setFacebookAdUrl(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="https://www.facebook.com/ads/library/"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="mt-4 rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={clsx(
                                        'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                                        isLoading && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    {isLoading ? 'Scraping...' : 'Scrape Ads'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
} 