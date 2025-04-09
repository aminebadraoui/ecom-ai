'use client';

import { useState } from 'react';
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
                throw new Error('Failed to fetch ads');
            }

            const data = await response.json();

            // Create a new project with the fetched ads
            const projectId = Date.now().toString();
            localStorage.setItem(`project_${projectId}_ads`, JSON.stringify(data.data));

            // Save workflow
            const workflowName = data.data[0]?.page_name || `Workflow ${new Date().toLocaleDateString()}`;
            const workflow = {
                id: projectId,
                name: workflowName,
                createdAt: new Date().toISOString(),
                ads: data.data,
            };

            const savedWorkflows = localStorage.getItem('workflows');
            const workflows = savedWorkflows ? JSON.parse(savedWorkflows) : [];
            workflows.push(workflow);
            localStorage.setItem('workflows', JSON.stringify(workflows));

            // Navigate to the new project page
            router.push(`/projects/${projectId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

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