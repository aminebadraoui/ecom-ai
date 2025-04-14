'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    image_url?: string;
}

interface ConceptData {
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
}

interface Concept {
    id: string;
    ad_archive_id: string;
    page_name: string;
    concept_json: ConceptData;
    created_at: string;
}

export default function NewAdRecipePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingAd, setIsCreatingAd] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adName, setAdName] = useState('New Ad');

    // For new product creation
    const [showNewProductForm, setShowNewProductForm] = useState(false);
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
        name: '',
        description: '',
        price: '',
        image_url: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get concept IDs from URL
                const conceptIds = searchParams.getAll('concepts');
                if (conceptIds.length === 0) {
                    setError('No concepts selected');
                    setIsLoading(false);
                    return;
                }

                // Fetch selected concepts
                const conceptsPromise = fetch(`/api/ad-concepts?ids=${conceptIds.join(',')}`);

                // Fetch available products
                const productsPromise = fetch('/api/products');

                const [conceptsResponse, productsResponse] = await Promise.all([
                    conceptsPromise,
                    productsPromise
                ]);

                if (!conceptsResponse.ok) {
                    throw new Error('Failed to fetch concepts');
                }

                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }

                const conceptsData = await conceptsResponse.json();
                const productsData = await productsResponse.json();

                setConcepts(conceptsData.concepts || []);
                setProducts(productsData.products || []);

                // Set default product if available
                if (productsData.products && productsData.products.length > 0) {
                    setSelectedProduct(productsData.products[0].id);
                }

                // Set default name based on first concept
                if (conceptsData.concepts && conceptsData.concepts.length > 0) {
                    const firstConcept = conceptsData.concepts[0];
                    setAdName(`Ad for ${firstConcept.page_name || 'Unknown'}`);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [searchParams]);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newProduct.name || !newProduct.description || !newProduct.price) {
            toast.error('Please fill out all required fields');
            return;
        }

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProduct),
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const data = await response.json();

            // Add new product to list and select it
            setProducts(prev => [...prev, data.product]);
            setSelectedProduct(data.product.id);

            // Reset form and hide it
            setNewProduct({
                name: '',
                description: '',
                price: '',
                image_url: '',
            });
            setShowNewProductForm(false);

            toast.success('Product created successfully');
        } catch (err) {
            console.error('Error creating product:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to create product');
        }
    };

    const handleGenerateAd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct) {
            toast.error('Please select a product');
            return;
        }

        if (concepts.length === 0) {
            toast.error('No concepts selected');
            return;
        }

        setIsCreatingAd(true);
        setError(null);

        try {
            const response = await fetch('/api/ad-recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conceptIds: concepts.map(c => c.id),
                    productId: selectedProduct,
                    name: adName
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate ad');
            }

            const data = await response.json();
            toast.success('Ad generated successfully!');

            // Redirect to the new ad recipe
            router.push(`/ad-recipes/${data.recipe.id}`);
        } catch (err) {
            console.error('Error generating ad:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate ad');
            toast.error(err instanceof Error ? err.message : 'Failed to generate ad');
        } finally {
            setIsCreatingAd(false);
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

    if (error && concepts.length === 0) {
        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-red-800">Error</h3>
                        <p className="mt-2 text-sm text-red-700">{error}</p>
                        <div className="mt-4">
                            <Link
                                href="/concepts"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back to Concepts
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Generate Ad from Concepts</h1>
                    <Link
                        href="/concepts"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Concepts
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 112 0v3a1 1 0 11-2 0v-3zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900">Selected Concepts ({concepts.length})</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {concepts.map((concept) => (
                                <div key={concept.id} className="border border-gray-200 rounded-md p-3">
                                    <h3 className="text-sm font-medium text-gray-700">{concept.page_name || 'Unnamed Concept'}</h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Layout: {concept.concept_json?.layout?.primaryElement || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Tone: {concept.concept_json?.messaging?.tone || 'Unknown'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-5">Create Ad</h2>

                        <form onSubmit={handleGenerateAd} className="space-y-6">
                            <div>
                                <label htmlFor="ad-name" className="block text-sm font-medium text-gray-700">
                                    Ad Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        id="ad-name"
                                        value={adName}
                                        onChange={(e) => setAdName(e.target.value)}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                                    Select Product
                                </label>
                                <div className="mt-1">
                                    {products.length > 0 ? (
                                        <select
                                            id="product"
                                            value={selectedProduct}
                                            onChange={(e) => setSelectedProduct(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            required
                                        >
                                            <option value="">Select a product</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} - ${product.price}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-gray-500">No products available. Create one below.</p>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewProductForm(!showNewProductForm)}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        {showNewProductForm ? 'Cancel' : 'Add New Product'}
                                    </button>
                                </div>
                            </div>

                            {showNewProductForm && (
                                <div className="border border-gray-200 rounded-md p-4">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">New Product</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
                                                Product Name*
                                            </label>
                                            <input
                                                type="text"
                                                id="product-name"
                                                value={newProduct.name}
                                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                required={showNewProductForm}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">
                                                Description*
                                            </label>
                                            <textarea
                                                id="product-description"
                                                value={newProduct.description}
                                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                                rows={3}
                                                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                required={showNewProductForm}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">
                                                Price*
                                            </label>
                                            <input
                                                type="text"
                                                id="product-price"
                                                value={newProduct.price}
                                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                placeholder="19.99"
                                                required={showNewProductForm}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="product-image" className="block text-sm font-medium text-gray-700">
                                                Image URL
                                            </label>
                                            <input
                                                type="url"
                                                id="product-image"
                                                value={newProduct.image_url || ''}
                                                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>

                                        <div>
                                            <button
                                                type="button"
                                                onClick={handleCreateProduct}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Create Product
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-5">
                                <div className="flex justify-end">
                                    <Link
                                        href="/concepts"
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isCreatingAd || !selectedProduct || concepts.length === 0}
                                        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isCreatingAd || !selectedProduct || concepts.length === 0
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                            }`}
                                    >
                                        {isCreatingAd ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </>
                                        ) : (
                                            'Generate Ad'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
} 