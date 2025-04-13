'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ConceptDetails {
    id: string;
    user_id: string;
    ad_archive_id: string;
    page_name: string | null;
    concept_json: {
        title: string;
        summary: string;
        details: {
            elements: Array<{
                type: string;
                position: string;
                purpose: string;
                styling: string;
            }>;
            visual_flow: string;
            visual_tone: string;
            best_practices: string[];
            color_palette: {
                primary: string;
                secondary: string;
                accent: string;
            };
            spacing_strategy: string;
        };
    };
    task_id: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    error?: string;
}

export default function ConceptPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [concept, setConcept] = useState<ConceptDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConcept = async () => {
            try {
                const response = await fetch(`/api/ad-concepts/${params.id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Concept not found');
                    } else if (response.status === 401) {
                        router.push('/login');
                        return;
                    } else {
                        throw new Error('Failed to fetch concept');
                    }
                    return;
                }

                const data = await response.json();
                setConcept(data.concept);

                // If the concept is still pending, set up SSE connection
                if (data.concept.status === 'pending') {
                    const eventSource = new EventSource(`/api/ad-concepts/${params.id}/stream`, {
                        withCredentials: true
                    });

                    eventSource.onmessage = (event) => {
                        const updatedData = JSON.parse(event.data);
                        setConcept(prev => ({
                            ...prev!,
                            status: updatedData.status,
                            concept_json: updatedData.concept_json,
                            error: updatedData.error
                        }));

                        if (updatedData.status === 'completed' || updatedData.status === 'failed') {
                            eventSource.close();
                        }
                    };

                    eventSource.onerror = () => {
                        console.error('SSE connection error');
                        eventSource.close();
                    };

                    return () => {
                        eventSource.close();
                    };
                }
            } catch (err) {
                console.error('Error fetching concept:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConcept();
    }, [params.id, router]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
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
                        <Link
                            href="/dashboard"
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {concept.concept_json?.title || 'Ad Concept'}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${concept.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    concept.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {concept.status.charAt(0).toUpperCase() + concept.status.slice(1)}
                            </span>
                        </div>

                        {concept.status === 'pending' && (
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <div className="mr-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                    </div>
                                    <p className="text-sm text-gray-500">Generating concept...</p>
                                </div>
                            </div>
                        )}

                        {concept.status === 'failed' && concept.error && (
                            <div className="mb-6 bg-red-50 p-4 rounded-md">
                                <p className="text-sm text-red-700">{concept.error}</p>
                            </div>
                        )}

                        {concept.status === 'completed' && concept.concept_json && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                                    <p className="mt-2 text-sm text-gray-500">{concept.concept_json.summary}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Elements</h3>
                                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {concept.concept_json.details.elements.map((element, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-900 capitalize">
                                                    {element.type.replace(/_/g, ' ')}
                                                </h4>
                                                <dl className="mt-2 text-sm text-gray-500">
                                                    <div>
                                                        <dt className="inline font-medium">Position: </dt>
                                                        <dd className="inline">{element.position}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="inline font-medium">Purpose: </dt>
                                                        <dd className="inline">{element.purpose}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="inline font-medium">Styling: </dt>
                                                        <dd className="inline">{element.styling}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Visual Flow</h3>
                                    <p className="mt-2 text-sm text-gray-500">{concept.concept_json.details.visual_flow}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Visual Tone</h3>
                                    <p className="mt-2 text-sm text-gray-500">{concept.concept_json.details.visual_tone}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Best Practices</h3>
                                    <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
                                        {concept.concept_json.details.best_practices.map((practice, index) => (
                                            <li key={index}>{practice}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Color Palette</h3>
                                    <dl className="mt-2 text-sm text-gray-500">
                                        <div>
                                            <dt className="inline font-medium">Primary: </dt>
                                            <dd className="inline">{concept.concept_json.details.color_palette.primary}</dd>
                                        </div>
                                        <div>
                                            <dt className="inline font-medium">Secondary: </dt>
                                            <dd className="inline">{concept.concept_json.details.color_palette.secondary}</dd>
                                        </div>
                                        <div>
                                            <dt className="inline font-medium">Accent: </dt>
                                            <dd className="inline">{concept.concept_json.details.color_palette.accent}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Spacing Strategy</h3>
                                    <p className="mt-2 text-sm text-gray-500">{concept.concept_json.details.spacing_strategy}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-8">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 