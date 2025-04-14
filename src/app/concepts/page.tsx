'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ConceptData {
    title: string;
    details: {
        elements: Array<{
            type: string;
            purpose: string;
            styling: string;
            position: string;
        }>;
        visual_flow: string;
        visual_tone: string;
        color_palette: {
            primary?: string;
            secondary?: string;
            accent?: string;
        };
        best_practices: string[];
        spacing_strategy: string;
    };
    summary: string;
}

interface AdConcept {
    id: string;
    ad_archive_id: string;
    page_name: string;
    concept_json: ConceptData;
    created_at: string;
}

export default function ConceptsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [concepts, setConcepts] = useState<AdConcept[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        const fetchConcepts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/ad-concepts');

                if (!response.ok) {
                    if (response.status === 401) {
                        router.push('/login?redirect=/concepts');
                        return;
                    }
                    throw new Error('Failed to fetch concepts');
                }

                const data = await response.json();
                console.log('FETCHED CONCEPTS RAW DATA:', data);
                console.log('CONCEPTS ARRAY:', data.concepts);

                if (data.concepts && data.concepts.length > 0) {
                    // Log the first concept to see its structure
                    console.log('FIRST CONCEPT OBJECT:', data.concepts[0]);
                    console.log('CONCEPT JSON:', data.concepts[0].concept_json);

                    // Log accessing the properties we're trying to display
                    const firstConcept = data.concepts[0];
                    console.log('PAGE NAME:', firstConcept.page_name);
                    console.log('CREATED AT:', firstConcept.created_at);

                    if (firstConcept.concept_json) {
                        console.log('LAYOUT PRIMARY ELEMENT:',
                            firstConcept.concept_json?.layout?.primaryElement);
                        console.log('MESSAGING TONE:',
                            firstConcept.concept_json?.messaging?.tone);
                        console.log('MESSAGING APPROACH:',
                            firstConcept.concept_json?.messaging?.approach);
                    }
                }

                setConcepts(data.concepts || []);
            } catch (err) {
                console.error('Error fetching concepts:', err);
                setError(err instanceof Error ? err.message : 'Failed to load concepts');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConcepts();
    }, [router]);

    const handleSelectConcept = (conceptId: string) => {
        let newSelectedConcepts;
        if (selectedConcepts.includes(conceptId)) {
            newSelectedConcepts = selectedConcepts.filter(id => id !== conceptId);
        } else {
            newSelectedConcepts = [...selectedConcepts, conceptId];
        }

        setSelectedConcepts(newSelectedConcepts);
        setSelectAll(newSelectedConcepts.length === concepts.length);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedConcepts([]);
        } else {
            setSelectedConcepts(concepts.map(concept => concept.id));
        }
        setSelectAll(!selectAll);
    };

    const handleGenerateAds = () => {
        if (selectedConcepts.length > 0) {
            const queryString = selectedConcepts.map(id => `concepts=${id}`).join('&');
            router.push(`/ad-recipes/new?${queryString}`);
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
                            onClick={() => window.location.reload()}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Ad Concepts</h1>
                    <div className="flex space-x-3">
                        {selectedConcepts.length > 0 && (
                            <button
                                onClick={handleGenerateAds}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Generate Ads ({selectedConcepts.length})
                            </button>
                        )}
                        <Link
                            href="/projects/new"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Ad Scraper
                        </Link>
                        <Link
                            href="/ad-recipes"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Ad Recipes
                        </Link>
                    </div>
                </div>

                {concepts.length === 0 ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                        <p className="text-gray-500">No ad concepts found. Generate concepts from your projects.</p>
                        <div className="mt-5">
                            <Link
                                href="/projects/new"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Go to Ad Scraper
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 mr-2 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Select All Concepts</span>
                                {selectedConcepts.length > 0 && (
                                    <span className="ml-2 text-sm text-gray-500">({selectedConcepts.length} selected)</span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {concepts.map((concept) => (
                                <div key={concept.id} className={`bg-white shadow overflow-hidden sm:rounded-lg p-6 ${selectedConcepts.includes(concept.id) ? 'ring-2 ring-indigo-500' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedConcepts.includes(concept.id)}
                                                onChange={() => handleSelectConcept(concept.id)}
                                                className="h-4 w-4 mr-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <div>
                                                <h2 className="text-lg font-medium text-gray-900">{concept.concept_json?.title || concept.page_name || 'Unnamed Concept'}</h2>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Created {new Date(concept.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">Layout</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {concept.concept_json?.details?.elements?.[0]?.type
                                                ? concept.concept_json.details.elements[0].type.replace(/_/g, ' ')
                                                : 'Unknown'} focused
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-sm font-medium text-gray-900">Messaging</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {concept.concept_json?.details?.visual_tone || 'Unknown'} tone with {concept.concept_json?.details?.visual_flow ? 'dynamic' : 'standard'} approach
                                        </p>
                                    </div>

                                    <div className="mt-6 flex space-x-3">
                                        <Link
                                            href={`/concepts/${concept.id}`}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            onClick={() => router.push(`/ad-recipes/new?concepts=${concept.id}`)}
                                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Generate Ad
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 