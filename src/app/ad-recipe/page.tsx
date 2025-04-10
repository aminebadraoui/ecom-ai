'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

interface AdConcept {
    id: string;
    ad_archive_id: string;
    page_name: string;
    concept_json: any;
    created_at: string;
}

interface Product {
    id: string;
    name: string;
    sales_url: string;
    details_json: any;
    created_at: string;
}

interface AdRecipe {
    id?: string;
    name: string;
    ad_concept_ids: string[];
    product_id: string;
    prompt_json: any;
    created_at?: string;
}

export default function AdRecipePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Use useMemo to prevent unnecessary recalculations
    const productId = useMemo(() => searchParams.get('product'), [searchParams]);
    const conceptIds = useMemo(() => searchParams.get('concepts')?.split(',') || [], [searchParams]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adConcepts, setAdConcepts] = useState<AdConcept[]>([]);
    const [product, setProduct] = useState<Product | null>(null);
    const [recipeName, setRecipeName] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [hasLoadedData, setHasLoadedData] = useState(false);

    // Load data when the page loads
    useEffect(() => {
        // Skip if we don't have valid data to fetch with
        if (!productId || conceptIds.length === 0) {
            setError('Missing product or concept IDs');
            setIsLoading(false);
            return;
        }

        // Skip if we've already loaded the data
        if (hasLoadedData) {
            return;
        }

        // Use a stable flag to track component mount state
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch concepts
                const conceptsResponse = await fetch(`/api/ad-concepts?adIds=${conceptIds.join(',')}`);

                // Check if component is still mounted
                if (!isMounted) return;

                if (!conceptsResponse.ok) {
                    throw new Error('Failed to fetch ad concepts');
                }

                const conceptsData = await conceptsResponse.json();

                // Skip updates if unmounted
                if (!isMounted) return;
                setAdConcepts(conceptsData.concepts || []);

                // Fetch product
                const productResponse = await fetch(`/api/products/${productId}`);

                // Skip if unmounted
                if (!isMounted) return;

                if (!productResponse.ok) {
                    throw new Error('Failed to fetch product');
                }

                const productData = await productResponse.json();

                // Skip if unmounted
                if (!isMounted) return;
                setProduct(productData.product);

                // Generate default recipe name
                const defaultName = `${productData.product.name} Ad - ${new Date().toLocaleDateString()}`;
                setRecipeName(defaultName);

                // Create the mock prompt for demonstration
                const mockPrompt = generateAdRecipePrompt(conceptsData.concepts[0]?.concept_json, productData.product.details_json);
                setGeneratedPrompt(mockPrompt);

                // Mark data as loaded
                setHasLoadedData(true);
            } catch (err) {
                // Skip if unmounted
                if (!isMounted) return;

                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                // Skip if unmounted
                if (!isMounted) return;

                setIsLoading(false);
            }
        };

        fetchData();

        // Cleanup function to prevent state updates after unmount
        return () => {
            isMounted = false;
        };
    }, [productId, conceptIds, hasLoadedData]);

    const generateAdRecipePrompt = (adConcept: any, productDetails: any) => {
        // This is a simplified version - in a real implementation, this would format the data
        // according to the prompt structure you provided
        return `You are an expert ad creative designer. Use the following inputs to generate a high-converting Facebook ad image (9:16 format):

Existing Ad Description (JSON):
${JSON.stringify(adConcept, null, 2)}

Product Info (JSON):
${JSON.stringify(productDetails, null, 2)}

Creative Instructions:
Format: Facebook Ad (9:16 square)
Design: Follow layout, concept, and ad structure from the ad description JSON.
Visuals: Extract all branding, colors, and product images only from the mockup.
Messaging: Use core messaging and tone from the ad JSON.
CTA: Include if part of the original concept.
Design Quality: Bold, scroll-stopping, mobile-optimized, and visually clean.

Goal: Reimagine the ad concept described in the JSON using the branding and visual identity from the product mockup — resulting in a compelling, brand-aligned Facebook ad creative that maintains proven layout structure and messaging effectiveness.`;
    };

    const handleSaveRecipe = async () => {
        if (!recipeName) {
            setError('Please enter a name for this ad recipe');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const adRecipe: AdRecipe = {
                name: recipeName,
                ad_concept_ids: adConcepts.map(c => c.id),
                product_id: productId!,
                prompt_json: {
                    ad_concepts: adConcepts.map(c => c.concept_json),
                    product_details: product?.details_json,
                    prompt_text: generatedPrompt
                }
            };

            const response = await fetch('/api/ad-recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adRecipe),
            });

            if (!response.ok) {
                throw new Error('Failed to save ad recipe');
            }

            const data = await response.json();

            // Redirect to success or recipe list page
            router.push('/dashboard?success=Recipe saved successfully');

        } catch (err) {
            console.error('Error saving recipe:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsSaving(false);
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

    if (error && (!product || adConcepts.length === 0)) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-red-800">Error</h3>
                        <p className="mt-2 text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold text-gray-900">Ad Recipe</h1>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Progress steps */}
                    <div className="mt-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                                1
                            </div>
                            <div className="h-1 w-12 bg-indigo-600"></div>
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                                2
                            </div>
                            <div className="h-1 w-12 bg-indigo-600"></div>
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                                3
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                            <div>Select Ads</div>
                            <div>Choose Product</div>
                            <div>Generate</div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recipe Name */}
                <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Name Your Ad Recipe</h2>
                    <div>
                        <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700">
                            Recipe Name
                        </label>
                        <input
                            type="text"
                            id="recipeName"
                            value={recipeName}
                            onChange={(e) => setRecipeName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter recipe name"
                        />
                    </div>
                </div>

                {/* Recipe Preview */}
                <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Ad Recipe Preview</h2>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Source Info */}
                        <div className="w-full md:w-1/3">
                            <div className="border border-gray-200 rounded-lg p-4 mb-4">
                                <h3 className="font-medium mb-2">Source Ad</h3>
                                {adConcepts.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium">{adConcepts[0].page_name}</p>
                                        <p className="text-xs text-gray-500">
                                            ID: {adConcepts[0].ad_archive_id.substring(0, 10)}...
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium mb-2">Product</h3>
                                {product && (
                                    <div>
                                        <p className="text-sm font-medium">{product.name}</p>
                                        <a href={product.sales_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800">
                                            View Sales Page
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Generated Prompt */}
                        <div className="w-full md:w-2/3">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium mb-2">Generated Prompt</h3>
                                <div className="bg-gray-50 p-4 rounded-md">
                                    <pre className="text-xs whitespace-pre-wrap font-mono text-gray-800 max-h-96 overflow-y-auto">{generatedPrompt}</pre>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Copy to Clipboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Generation - Coming Soon */}
                <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Image Generation</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Coming Soon
                        </span>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-md text-center">
                        <p className="text-gray-500">Image generation will be available soon.</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Use the generated prompt with your favorite AI image generation tool in the meantime.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveRecipe}
                        disabled={isSaving}
                        className={clsx(
                            'inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                            isSaving && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {isSaving ? 'Saving...' : 'Save Recipe'}
                    </button>
                </div>
            </div>
        </div>
    );
} 