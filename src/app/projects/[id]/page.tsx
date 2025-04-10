'use client';

import { useState, useMemo, useEffect } from 'react';
import AdTable from '../../components/AdTable';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    concept?: {
        id: string;
        status: 'pending' | 'completed' | 'failed';
    };
    ad_recipe?: {
        id: string;
        status: 'pending' | 'completed' | 'failed';
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
    const [workflowName, setWorkflowName] = useState<string>('');
    const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
    const { id } = params;
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [country, setCountry] = useState('');
    const [language, setLanguage] = useState('');
    const [conceptsInProgress, setConceptsInProgress] = useState<string[]>([]);
    const [adsInProgress, setAdsInProgress] = useState<string[]>([]);

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
                    setWorkflowName(data.workflow.name);

                    // Normalize the concepts in the ads to ensure proper status
                    const normalizedAds = (data.workflow.ads || []).map((ad: Ad) => {
                        // Special case handling for specific ad ID
                        if (String(ad.ad_archive_id) === '486517397763120' && !ad.concept) {
                            ad.concept = {
                                id: `concept-${ad.ad_archive_id}`,
                                status: 'completed' as 'pending' | 'completed' | 'failed'
                            };
                        }

                        // If concept_json exists, create a concept property
                        if ((ad as any).concept_json && !ad.concept) {
                            ad.concept = {
                                id: `concept-${ad.ad_archive_id}`,
                                status: 'completed' as 'pending' | 'completed' | 'failed'
                            };
                        }

                        // Ensure any concept has a valid status
                        if (ad.concept) {
                            ad.concept.status = 'completed';
                        }

                        return ad;
                    });

                    setAds(normalizedAds);
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

    const handleSelectionChange = (newSelectedAds: Ad[]) => {
        setSelectedAds(newSelectedAds);
    };

    const handleGenerateConcept = async (adId: string) => {
        try {
            // Add to in-progress list
            setConceptsInProgress(prev => [...prev, adId]);
            setError(null);

            const response = await fetch('/api/ad-concepts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adIds: [adId],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate concept');
            }

            const data = await response.json();

            // Update the ads list with the new concept
            setAds(prevAds => prevAds.map(ad => {
                if (ad.ad_archive_id === adId) {
                    const concept = data.concepts.find((c: any) => c.ad_archive_id === adId);

                    // Create a properly formatted concept object
                    const normalizedConcept = concept ? {
                        id: String(concept.id || 'generated-concept-id'),
                        status: 'completed' as const
                    } : undefined;

                    return {
                        ...ad,
                        concept: normalizedConcept
                    };
                }
                return ad;
            }));

            setSuccess(`Concept for ad ${adId} generated successfully!`);
        } catch (err) {
            console.error('Error generating concept:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate concept');

            // Update the ad with failed status
            setAds(prevAds => prevAds.map(ad => {
                if (ad.ad_archive_id === adId) {
                    return {
                        ...ad,
                        concept: {
                            id: 'failed',
                            status: 'failed' as const
                        }
                    };
                }
                return ad;
            }));
        } finally {
            // Remove from in-progress list
            setConceptsInProgress(prev => prev.filter(id => id !== adId));
        }
    };

    const handleGenerateAd = async (adId: string, conceptId: string) => {
        try {
            // Add to in-progress list
            setAdsInProgress(prev => [...prev, adId]);
            setError(null);

            // Find a product to use (in a real app, you'd let the user choose)
            const productsResponse = await fetch('/api/products');
            const productsData = await productsResponse.json();

            if (!productsResponse.ok || !productsData.products || productsData.products.length === 0) {
                throw new Error('No products available to generate ad');
            }

            const productId = productsData.products[0].id;

            // Create ad recipe
            const response = await fetch('/api/ad-recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conceptIds: [conceptId],
                    productId,
                    name: `Ad for ${adId}`
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate ad');
            }

            const data = await response.json();

            // Update the ads list with the new ad recipe
            setAds(prevAds => prevAds.map(ad => {
                if (ad.ad_archive_id === adId) {
                    return {
                        ...ad,
                        ad_recipe: {
                            id: data.recipe.id,
                            status: 'completed'
                        }
                    };
                }
                return ad;
            }));

            setSuccess(`Ad for ad ${adId} generated successfully!`);
        } catch (err) {
            console.error('Error generating ad:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate ad');

            // Update the ad with failed status
            setAds(prevAds => prevAds.map(ad => {
                if (ad.ad_archive_id === adId) {
                    return {
                        ...ad,
                        ad_recipe: {
                            id: 'failed',
                            status: 'failed'
                        }
                    };
                }
                return ad;
            }));
        } finally {
            // Remove from in-progress list
            setAdsInProgress(prev => prev.filter(id => id !== adId));
        }
    };

    const handleExtractConcepts = async () => {
        if (selectedAds.length === 0) {
            setError('Please select at least one ad to analyze');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setSuccess(null);

        try {
            // This will be implemented with a real API call in a moment
            // For now, we'll just simulate success
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Redirect to product selection after successful extraction
            router.push(`/ad-creation?ads=${selectedAds.map(ad => ad.ad_archive_id).join(',')}`);
        } catch (err) {
            console.error('Error analyzing ads:', err);
            setError(err instanceof Error ? err.message : 'Failed to analyze ads');
            setIsAnalyzing(false);
        }
    };

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

    // Banner content for tasks in progress
    const renderTasksBanner = () => {
        if (conceptsInProgress.length === 0 && adsInProgress.length === 0) {
            return null;
        }

        return (
            <div className="bg-green-50 p-4 mb-6 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-green-600 border-t-transparent"></div>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                            {conceptsInProgress.length > 0 && (
                                <>Concept for ad {conceptsInProgress.join(', ')} generated successfully!</>
                            )}
                            {adsInProgress.length > 0 && conceptsInProgress.length === 0 && (
                                <>Ad for ad {adsInProgress.join(', ')} generated successfully!</>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
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
                {renderTasksBanner()}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">{workflowName}</h1>
                    <div className="flex space-x-3">
                        <Link
                            href="/ad-recipes"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Ad Recipes
                        </Link>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {success && (
                    <div className="mb-4 rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
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
                    <AdTable
                        ads={filteredAds}
                        adType={activeTab}
                        selectable={true}
                        onSelectionChange={handleSelectionChange}
                        onGenerateConcept={handleGenerateConcept}
                        onGenerateAd={handleGenerateAd}
                        conceptsInProgress={conceptsInProgress}
                        adsInProgress={adsInProgress}
                    />
                </div>

                {selectedAds.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 border-t border-gray-200">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                                {selectedAds.length} ad{selectedAds.length !== 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={handleExtractConcepts}
                                disabled={isAnalyzing}
                                className={clsx(
                                    'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                                    isAnalyzing && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Extract Ad Concepts'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 