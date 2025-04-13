'use client';

import { useState, useMemo, useEffect } from 'react';
import AdTable from '../../components/AdTable';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

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
        images: Array<{
            resized_image_url: string | null;
        }>;
    };
    concept?: {
        id: string | null;
        task_id: string | null;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        concept_json?: any;
        error?: string;
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

interface AdTableProps {
    ads: Ad[];
    adType: 'image' | 'video';
    selectable: boolean;
    onSelectionChange: (ads: Ad[]) => void;
    onGenerateAd: (adId: string, conceptId: string) => Promise<void>;
    onGenerateConcept: (ad: Ad, imageUrl: string) => Promise<void>;
    conceptsInProgress: string[];
    adsInProgress: string[];
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
    const [showConceptGenerator, setShowConceptGenerator] = useState(false);

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

                    // Fetch concepts for all ads
                    const adArchiveIds = data.workflow.ads.map((ad: Ad) => ad.ad_archive_id);

                    const { data: concepts, error } = await supabase
                        .from('ad_concepts')
                        .select('*')
                        .in('ad_archive_id', adArchiveIds);

                    if (error) {
                        console.error('Error fetching concepts:', error);
                    } else {
                        // Map concepts to their respective ads
                        const adsWithConcepts = data.workflow.ads.map((ad: Ad) => {
                            const concept = concepts?.find(c => c.ad_archive_id === ad.ad_archive_id);
                            return concept ? {
                                ...ad,
                                concept: {
                                    id: concept.id,
                                    task_id: concept.task_id,
                                    status: concept.status,
                                    concept_json: concept.concept_json,
                                    error: concept.error
                                }
                            } : ad;
                        });

                        setAds(adsWithConcepts || []);
                    }
                }
            } catch (err) {
                console.error('Error fetching workflow:', err);
                setError(err instanceof Error ? err.message : 'Failed to load workflow');
            }
            setIsLoading(false);
        };

        fetchWorkflow();
    }, [id, router]);

    const handleGenerateConcept = async (ad: Ad, imageUrl: string) => {
        console.log('handleGenerateConcept called with:', {
            ad_archive_id: ad.ad_archive_id,
            imageUrl,
            adType: activeTab,
            adSnapshot: ad.snapshot
        });

        if (!imageUrl) {
            console.error('imageUrl is undefined or empty');
            toast.error('No image URL available for this ad');
            return;
        }

        try {
            console.log('Starting concept generation for ad:', {
                ad_archive_id: ad.ad_archive_id,
                image_url: imageUrl
            });

            // Add to in-progress list
            setConceptsInProgress(prev => [...prev, ad.ad_archive_id]);
            setError(null);

            // First, clear any existing concept data for this ad
            setAds(prevAds => prevAds.map(a => {
                if (a.ad_archive_id === ad.ad_archive_id) {
                    const { concept, ...rest } = a;
                    return rest;
                }
                return a;
            }));

            console.log('Sending POST request to /api/ad-concepts with:', {
                ad_archive_id: ad.ad_archive_id,
                image_url: imageUrl
            });

            const response = await fetch('/api/ad-concepts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ad_archive_id: ad.ad_archive_id,
                    image_url: imageUrl
                }),
                // Include credentials to send cookies
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from API:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                if (response.status === 401) {
                    toast.error('Please log in to generate concepts');
                    router.push('/login');
                    return;
                }

                toast.error(`Error generating concept: ${errorData.error || response.statusText}`);
                setAds(prevAds => prevAds.map(a => {
                    if (a.ad_archive_id === ad.ad_archive_id) {
                        return {
                            ...a,
                            concept: {
                                id: null,
                                task_id: null,
                                status: 'failed' as const,
                                error: errorData.error || response.statusText
                            }
                        };
                    }
                    return a;
                }));
                return;
            }

            const responseData = await response.json();
            console.log('Received concept data from API:', responseData);

            // Update the ad with the new concept data
            setAds(prevAds => prevAds.map(a => {
                if (a.ad_archive_id === ad.ad_archive_id) {
                    return {
                        ...a,
                        concept: {
                            id: responseData.id,
                            task_id: responseData.task_id,
                            status: responseData.status,
                        }
                    };
                }
                return a;
            }));

            // Set up SSE connection to our internal API
            console.log('Setting up SSE connection to:', responseData.sse_url);
            const eventSource = new EventSource(responseData.sse_url, {
                withCredentials: true // Include cookies in the SSE request
            });

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received SSE update:', data);

                // Update the ad with the completed concept data
                setAds(prevAds => prevAds.map(a => {
                    if (a.ad_archive_id === ad.ad_archive_id) {
                        return {
                            ...a,
                            concept: {
                                id: data.id,
                                task_id: data.task_id,
                                status: data.status,
                                concept_json: data.concept_json,
                                error: data.error
                            }
                        };
                    }
                    return a;
                }));

                // Remove from in-progress list
                setConceptsInProgress(prev => prev.filter(id => id !== ad.ad_archive_id));

                if (data.status === 'completed') {
                    setSuccess(`Concept for ad ${ad.ad_archive_id} generated successfully!`);
                    eventSource.close();
                } else if (data.status === 'failed') {
                    setError(`Failed to generate concept for ad ${ad.ad_archive_id}: ${data.error || 'Unknown error'}`);
                    eventSource.close();
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                eventSource.close();

                // Update the concept status to failed
                setAds(prevAds => prevAds.map(a => {
                    if (a.ad_archive_id === ad.ad_archive_id) {
                        return {
                            ...a,
                            concept: {
                                id: responseData.id,
                                task_id: responseData.task_id,
                                status: 'failed' as const,
                                error: 'Connection error'
                            }
                        };
                    }
                    return a;
                }));

                // Remove from in-progress list
                setConceptsInProgress(prev => prev.filter(id => id !== ad.ad_archive_id));
                setError(`Failed to generate concept for ad ${ad.ad_archive_id}: Connection error`);
            };

            // Add event listener for when the connection is opened
            eventSource.onopen = () => {
                console.log('SSE connection opened');
            };
        } catch (err) {
            console.error('Error in handleGenerateConcept:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate concept');

            // Remove from in-progress list
            setConceptsInProgress(prev => prev.filter(id => id !== ad.ad_archive_id));
        }
    };

    const filteredAds = useMemo(() => {
        console.log('Filtering ads:', { total: ads.length, activeTab });
        if (activeTab === 'image') {
            const imageAds = ads.filter(ad => {
                const hasImageCard = ad.snapshot?.cards?.some(card => {
                    console.log('Checking card:', {
                        ad_archive_id: ad.ad_archive_id,
                        card_image_url: card.resized_image_url
                    });
                    return card.resized_image_url;
                }) ||
                    ad.snapshot?.images?.some(image => {
                        console.log('Checking image:', {
                            ad_archive_id: ad.ad_archive_id,
                            image_url: image.resized_image_url
                        });
                        return image.resized_image_url;
                    });
                console.log('Ad filtering:', {
                    id: ad.ad_archive_id,
                    hasImageCard,
                    cards: ad.snapshot?.cards,
                    images: ad.snapshot?.images
                });
                return hasImageCard;
            });
            console.log('Found image ads:', imageAds.length);
            return imageAds;
        } else {
            const videoAds = ads.filter(ad => {
                const hasVideos = ad.snapshot?.videos && ad.snapshot.videos.length > 0;
                console.log('Ad filtering:', {
                    id: ad.ad_archive_id,
                    hasVideos,
                    videos: ad.snapshot?.videos
                });
                return hasVideos;
            });
            console.log('Found video ads:', videoAds.length);
            return videoAds;
        }
    }, [ads, activeTab]);

    const handleSelectionChange = (newSelectedAds: any[]) => {
        setSelectedAds(newSelectedAds);
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

    const handleExtractConcepts = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent | undefined) => {
        // Prevent any navigation
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (selectedAds.length === 0) {
            setError('Please select at least one ad to analyze');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setSuccess(null);

        try {
            // Instead of redirecting, process the ads directly here
            const adIds = selectedAds.map(ad => ad.ad_archive_id);
            console.log(`Processing ${adIds.length} ads for concept extraction`);

            // Show the ConceptGenerator for the selected ads
            setShowConceptGenerator(true);
        } catch (err) {
            console.error('Error preparing to analyze ads:', err);
            setError(err instanceof Error ? err.message : 'Failed to prepare ad analysis');
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

            const updatedData = await updateResponse.json();
            setAds(updatedData.workflow.ads || []);
            setSuccess('Ads fetched and workflow updated successfully!');
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
                            Image Ads ({ads.filter(ad => !ad.snapshot?.videos || ad.snapshot.videos.length === 0 || ad.snapshot?.cards?.some(card => card.resized_image_url)).length})
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
                            Video Ads ({ads.filter(ad => ad.snapshot?.videos && ad.snapshot.videos.length > 0).length})
                        </button>
                    </nav>
                </div>

                {showConceptGenerator && selectedAds.length > 0 && (
                    <div className="mb-6">
                        {/* Concept generator component */}
                    </div>
                )}

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                    <AdTable
                        ads={filteredAds}
                        adType={activeTab}
                        selectable={true}
                        onSelectionChange={handleSelectionChange}
                        onGenerateAd={handleGenerateAd}
                        onGenerateConcept={handleGenerateConcept}
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