'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicJsonViewer from '../../components/DynamicJsonViewer';

interface ConceptData {
    layout?: {
        primaryElement?: string;
        components?: Array<{
            type?: string;
            position?: string;
            style?: string;
            [key: string]: any;
        }>;
        background?: {
            type?: string;
            color?: string;
            [key: string]: any;
        } | string;
        [key: string]: any;
    };
    messaging?: {
        tone?: string;
        approach?: string;
        keyElements?: string[];
        [key: string]: any;
    };
    visualStyle?: {
        colorScheme?: string;
        imageType?: string;
        textOverlay?: string;
        [key: string]: any;
    };
    template_name?: string;
    visual_tone?: string;
    design_purpose?: {
        goals?: string[];
        marketing_goals?: string[];
        [key: string]: any;
    };
    components?: Array<{
        type?: string;
        position?: string | { [key: string]: any };
        [key: string]: any;
    }>;
    [key: string]: any; // To support any other dynamic properties
}

interface AdConcept {
    id: string;
    ad_archive_id: string;
    page_name: string;
    concept_json: ConceptData;
    created_at: string;
}

interface PageParams {
    id: string;
}

export default function ConceptDetailPage({ params }: { params: PageParams }) {
    const router = useRouter();
    const [concept, setConcept] = useState<AdConcept | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'json'>('summary');
    const { id } = params;

    useEffect(() => {
        const fetchConcept = async () => {
            setIsLoading(true);
            try {
                // Fetch concept from API
                const response = await fetch(`/api/ad-concepts/${id}`);

                if (!response.ok) {
                    if (response.status === 401) {
                        // If unauthorized, redirect to login
                        router.push('/login');
                        return;
                    }
                    throw new Error('Failed to fetch concept');
                }

                const data = await response.json();
                if (data.concept) {
                    setConcept(data.concept);
                } else {
                    throw new Error('Concept not found');
                }
            } catch (err) {
                console.error('Error fetching concept:', err);
                setError(err instanceof Error ? err.message : 'Failed to load concept');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConcept();
    }, [id, router]);

    const handleGenerateAd = async () => {
        try {
            // Find a product to use (in a real app, you'd let the user choose)
            const productsResponse = await fetch('/api/products');
            const productsData = await productsResponse.json();

            if (!productsResponse.ok || !productsData.products || productsData.products.length === 0) {
                throw new Error('No products available to generate ad');
            }

            const productId = productsData.products[0].id;

            // Create ad recipe
            router.push(`/ad-recipe?concepts=${id}&product=${productId}`);
        } catch (err) {
            console.error('Error preparing ad generation:', err);
            setError(err instanceof Error ? err.message : 'Failed to prepare ad generation');
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

    if (error || !concept) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-red-800">Error</h3>
                        <p className="mt-2 text-sm text-red-700">{error || 'Concept not found'}</p>
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

    // Try to extract top-level properties for summary view if available
    const layoutInfo = concept.concept_json.layout || {};
    const messagingInfo = concept.concept_json.messaging || {};
    const visualStyleInfo = concept.concept_json.visualStyle || {};

    // Check for alternative structure patterns
    const templateName = concept.concept_json.template_name || '';
    const visualTone = concept.concept_json.visual_tone || '';
    const designPurpose = concept.concept_json.design_purpose || {};
    const components = concept.concept_json.components || [];

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Ad Concept</h1>
                    <div className="flex space-x-3">
                        <Link
                            href="/concepts"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            All Concepts
                        </Link>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {concept.page_name || templateName || 'Concept Details'}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Created on {new Date(concept.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`${activeTab === 'summary'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                            >
                                Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('json')}
                                className={`${activeTab === 'json'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                            >
                                JSON Data
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'summary' && (
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                                {/* Conditional rendering based on available data */}
                                {templateName && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Template</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            {templateName}
                                        </dd>
                                    </div>
                                )}

                                {visualTone && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Visual Tone</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            {visualTone}
                                        </dd>
                                    </div>
                                )}

                                {/* Layout Section */}
                                {(layoutInfo.primaryElement || Object.keys(layoutInfo).length > 0) && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Layout</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            {layoutInfo.primaryElement && (
                                                <div className="mb-2">
                                                    <span className="font-medium">Primary Element:</span> {layoutInfo.primaryElement}
                                                </div>
                                            )}
                                            {layoutInfo.background && (
                                                <div className="mb-2">
                                                    <span className="font-medium">Background:</span> {
                                                        typeof layoutInfo.background === 'string'
                                                            ? layoutInfo.background
                                                            : typeof layoutInfo.background === 'object' && layoutInfo.background.type
                                                                ? layoutInfo.background.type
                                                                : 'Complex background'
                                                    }
                                                </div>
                                            )}
                                            {layoutInfo.components && layoutInfo.components.length > 0 && (
                                                <div>
                                                    <span className="font-medium">Components:</span>
                                                    <ul className="mt-1 list-disc list-inside">
                                                        {layoutInfo.components.map((component: any, index: number) => (
                                                            <li key={index}>{component.type || component.position || component.style || 'Component'}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </dd>
                                    </div>
                                )}

                                {/* Components Section (for alternative structure) */}
                                {components.length > 0 && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Components</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            <ul className="mt-1 list-disc list-inside">
                                                {components.map((component: any, index: number) => (
                                                    <li key={index} className="mb-2">
                                                        <span className="font-medium">{component.type || `Component ${index + 1}`}</span>
                                                        {component.position && (
                                                            <span className="text-gray-500"> - {
                                                                typeof component.position === 'string'
                                                                    ? component.position
                                                                    : 'Custom position'
                                                            }</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </dd>
                                    </div>
                                )}

                                {/* Design Purpose / Goals */}
                                {(designPurpose.goals || designPurpose.marketing_goals) && (
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-gray-500">Goals</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            <ul className="mt-1 list-disc list-inside">
                                                {(designPurpose.goals || designPurpose.marketing_goals || []).map((goal: string, index: number) => (
                                                    <li key={index}>{goal}</li>
                                                ))}
                                            </ul>
                                        </dd>
                                    </div>
                                )}

                                {/* Original Ad Link */}
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Original Ad</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <Link
                                            href={`https://www.facebook.com/ads/library/?id=${concept.ad_archive_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-500"
                                        >
                                            View Original Ad in Facebook Ad Library
                                        </Link>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}

                    {activeTab === 'json' && (
                        <div className="p-6">
                            <DynamicJsonViewer data={concept.concept_json} initialOpenDepth={2} />
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleGenerateAd}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Generate Ad from this Concept
                    </button>
                </div>
            </div>
        </div>
    );
} 