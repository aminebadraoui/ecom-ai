'use client';

import { useState, useMemo, useEffect } from 'react';
import AdTable from '../../components/AdTable';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

interface Ad {
    ad_archive_id: string;
    start_date: number;
    url: string;
    page_name: string;
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

type ActiveTab = 'image' | 'video';

interface PageParams {
    id: string;
}

export default function ProjectPage({ params }: { params: PageParams }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ActiveTab>('image');
    const [ads, setAds] = useState<Ad[]>([]);
    const [pageName, setPageName] = useState<string>('');
    const { id } = params;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [country, setCountry] = useState('');
    const [language, setLanguage] = useState('');

    // Load workflow data from API on mount
    useEffect(() => {
        const fetchWorkflow = async () => {
            setIsLoading(true);
            try {
                // Fetch workflow from API
                const response = await fetch(`/api/workflows/${id}`);

                if (!response.ok) {
                    if (response.status === 401) {
                        // If unauthorized, redirect to login
                        router.push('/login');
                        return;
                    }
                    throw new Error('Failed to fetch workflow');
                }

                const data = await response.json();
                if (data.workflow) {
                    setPageName(data.workflow.name);
                    setAds(data.workflow.ads || []);
                }
            } catch (err) {
                console.error('Error fetching workflow:', err);
                setError(err instanceof Error ? err.message : 'Failed to load workflow');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkflow();
    }, [id, router]);

    const filteredAds = useMemo(() => {
        if (activeTab === 'image') {
            return ads.filter(ad =>
                (ad.snapshot?.videos === null || ad.snapshot?.videos?.length === 0) &&
                ad.snapshot?.cards?.[0]?.resized_image_url
            );
        } else {
            return ads.filter(ad => ad.snapshot?.videos?.length > 0);
        }
    }, [ads, activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/facebook-ads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchTerm,
                    startDate,
                    endDate,
                    country,
                    language,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ads');
            }

            const data = await response.json();
            setAds(data.ads);

            // Update workflow via API
            const updateResponse = await fetch(`/api/workflows/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ads: data.ads
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update workflow');
            }

            setSuccess('Ads fetched successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
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

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-red-800">Error</h3>
                        <p className="mt-2 text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                {pageName && (
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">{pageName}</h1>
                    </div>
                )}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('image')}
                            className={clsx(
                                activeTab === 'image'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                            )}
                        >
                            Image Ads ({ads.filter(ad => (ad.snapshot?.videos === null || ad.snapshot?.videos?.length === 0) && ad.snapshot?.cards?.[0]?.resized_image_url).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('video')}
                            className={clsx(
                                activeTab === 'video'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                            )}
                        >
                            Video Ads ({ads.filter(ad => ad.snapshot?.videos?.length > 0).length})
                        </button>
                    </nav>
                </div>

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                    <AdTable ads={filteredAds} adType={activeTab} />
                </div>
            </div>
        </div>
    );
} 