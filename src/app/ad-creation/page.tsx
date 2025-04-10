'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';

interface AdConcept {
    id: string;
    ad_archive_id: string;
    page_name: string;
    concept_json: {
        layout: {
            primaryElement: string;
            components: Array<{
                type: string;
                position: string;
                style: string;
            }>;
        };
        messaging: {
            tone: string;
            approach: string;
            keyElements: string[];
        };
        visualStyle: {
            colorScheme: string;
            imageType: string;
            textOverlay: string;
        };
    };
    created_at: string;
}

interface Product {
    id: string;
    name: string;
    sales_url: string;
    details_json: any;
    created_at: string;
}

export default function AdCreationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const adIds = searchParams.get('ads')?.split(',') || [];

    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adConcepts, setAdConcepts] = useState<AdConcept[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [showNewProductForm, setShowNewProductForm] = useState(false);
    const [newProductUrl, setNewProductUrl] = useState('');
    const [newProductName, setNewProductName] = useState('');
    const [isExtractingProduct, setIsExtractingProduct] = useState(false);
    const [hasLoadedConcepts, setHasLoadedConcepts] = useState(false);

    // Load ad concepts when the page loads
    useEffect(() => {
        const fetchAdConcepts = async () => {
            if (adIds.length === 0) {
                setError('No ads selected');
                setIsLoading(false);
                return;
            }

            // Skip loading if we've already loaded concepts
            if (hasLoadedConcepts) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // First check if we already have the concepts
                const conceptsResponse = await fetch(`/api/ad-concepts?adIds=${adIds.join(',')}`);

                if (!conceptsResponse.ok) {
                    throw new Error('Failed to fetch ad concepts');
                }

                const conceptsData = await conceptsResponse.json();
                console.log('Fetched concepts data:', conceptsData);

                // If we have any concepts, use them; otherwise create new ones
                if (conceptsData.concepts && conceptsData.concepts.length > 0) {
                    console.log('Using existing concepts:', conceptsData.concepts);
                    setAdConcepts(conceptsData.concepts);
                    setHasLoadedConcepts(true);
                } else {
                    // Otherwise, extract concepts
                    setIsAnalyzing(true);
                    const extractResponse = await fetch('/api/ad-concepts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            adIds,
                        }),
                    });

                    if (!extractResponse.ok) {
                        throw new Error('Failed to extract ad concepts');
                    }

                    const extractData = await extractResponse.json();
                    console.log('Extracted new concepts:', extractData);
                    setAdConcepts(extractData.concepts);
                    setIsAnalyzing(false);
                    setHasLoadedConcepts(true);
                }

                // Fetch products
                const productsResponse = await fetch('/api/products');

                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }

                const productsData = await productsResponse.json();
                setProducts(productsData.products || []);

            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setIsAnalyzing(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdConcepts();
    }, [adIds, hasLoadedConcepts]);

    const handleProductSelect = (productId: string) => {
        setSelectedProductId(productId);
        setShowNewProductForm(false);
    };

    const handleNewProductToggle = () => {
        setShowNewProductForm(!showNewProductForm);
        setSelectedProductId(null);
    };

    const handleExtractProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newProductUrl) {
            setError('Please enter a product URL');
            return;
        }

        setIsExtractingProduct(true);
        setError(null);

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newProductName || `Product ${new Date().toLocaleDateString()}`,
                    sales_url: newProductUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to extract product information');
            }

            const data = await response.json();

            // Add the new product to our list and select it
            setProducts([...products, data.product]);
            setSelectedProductId(data.product.id);
            setShowNewProductForm(false);

            // Clear the form
            setNewProductUrl('');
            setNewProductName('');

        } catch (err) {
            console.error('Error extracting product:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsExtractingProduct(false);
        }
    };

    const handleGenerateAd = async () => {
        if (!selectedProductId) {
            setError('Please select a product');
            return;
        }

        // Make ad concepts optional - don't block if they aren't loaded due to auth errors or other issues
        // Just pass whatever concepts are available (may be empty array)
        router.push(`/ad-recipe?product=${selectedProductId}&concepts=${adConcepts.map(c => c.id).join(',')}`);
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

    if (error && !adConcepts.length) {
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
                        <h1 className="text-2xl font-semibold text-gray-900">Create Ad</h1>
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
                            <div className="h-1 w-12 bg-gray-300"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-medium">
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

                {isAnalyzing ? (
                    <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                        <p className="text-center text-gray-700">Analyzing ad concepts...</p>
                        <div className="flex justify-center mt-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Ad Concepts Section */}
                        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Ad Concepts</h2>

                            {adConcepts.length === 0 ? (
                                <p className="text-sm text-gray-600">No ad concepts available or unable to load concepts.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {adConcepts.map((concept) => {
                                        // Check if concept_json is available and has the expected structure
                                        const layout = concept.concept_json?.layout;
                                        const messaging = concept.concept_json?.messaging;
                                        const visualStyle = concept.concept_json?.visualStyle;

                                        return (
                                            <div key={concept.id} className="border border-gray-200 rounded-lg p-4">
                                                <h3 className="font-medium">{concept.page_name || 'Unknown Page'}</h3>

                                                {!concept.concept_json && (
                                                    <p className="text-sm text-red-600 mt-2">Missing concept data</p>
                                                )}

                                                {layout && (
                                                    <div className="mt-2">
                                                        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {layout.primaryElement || 'Unknown'} focused with {layout.components?.length || 0} components
                                                        </p>
                                                    </div>
                                                )}

                                                {messaging && (
                                                    <div className="mt-2">
                                                        <h4 className="text-sm font-medium text-gray-700">Messaging</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {messaging.tone || 'Unknown'}, {messaging.approach || 'Unknown'} approach
                                                        </p>
                                                    </div>
                                                )}

                                                {visualStyle && (
                                                    <div className="mt-2">
                                                        <h4 className="text-sm font-medium text-gray-700">Visual Style</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {visualStyle.colorScheme || 'Unknown'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Product Selection Section */}
                        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Product</h2>

                            {/* Product selection buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {products.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductSelect(product.id)}
                                        className={clsx(
                                            'px-4 py-2 text-sm font-medium rounded-md',
                                            selectedProductId === product.id
                                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        )}
                                    >
                                        {product.name}
                                    </button>
                                ))}

                                <button
                                    onClick={handleNewProductToggle}
                                    className={clsx(
                                        'px-4 py-2 text-sm font-medium rounded-md',
                                        showNewProductForm
                                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    )}
                                >
                                    + New Product
                                </button>
                            </div>

                            {/* New product form */}
                            {showNewProductForm && (
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-medium mb-2">Add New Product</h3>
                                    <form onSubmit={handleExtractProduct}>
                                        <div className="mb-3">
                                            <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                                                Product Name (optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="productName"
                                                value={newProductName}
                                                onChange={(e) => setNewProductName(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder="Enter product name"
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700">
                                                Sales Page URL (required)
                                            </label>
                                            <input
                                                type="url"
                                                id="productUrl"
                                                value={newProductUrl}
                                                onChange={(e) => setNewProductUrl(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder="https://example.com/product"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isExtractingProduct}
                                            className={clsx(
                                                'w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                                                isExtractingProduct && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            {isExtractingProduct ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Extracting...
                                                </>
                                            ) : (
                                                'Extract Product Info'
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Selected product details */}
                            {selectedProductId && (
                                <div className="border border-gray-200 rounded-lg p-4 mt-4">
                                    <h3 className="font-medium mb-2">Selected Product</h3>
                                    {products.filter(p => p.id === selectedProductId).map(product => (
                                        <div key={product.id}>
                                            <h4 className="text-sm font-medium">{product.name}</h4>
                                            <a href={product.sales_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800">
                                                {product.sales_url}
                                            </a>

                                            {/* Display product details if available */}
                                            {product.details_json && (
                                                <div className="mt-2 border-t border-gray-100 pt-2">
                                                    {product.details_json.tagline && (
                                                        <p className="text-sm font-medium text-gray-900 mt-1">{product.details_json.tagline}</p>
                                                    )}

                                                    {product.details_json.key_benefits && product.details_json.key_benefits.length > 0 && (
                                                        <div className="mt-2">
                                                            <h5 className="text-xs font-medium text-gray-700">Key Benefits</h5>
                                                            <ul className="mt-1 text-xs text-gray-600 list-disc pl-5">
                                                                {product.details_json.key_benefits.slice(0, 3).map((benefit: string, index: number) => (
                                                                    <li key={index}>{benefit}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleGenerateAd}
                        disabled={isAnalyzing || !selectedProductId}
                        className={clsx(
                            'inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                            (isAnalyzing || !selectedProductId) && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        Continue to Ad Recipe
                    </button>
                </div>
            </div>
        </div>
    );
} 