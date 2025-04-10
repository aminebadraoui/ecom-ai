'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface AdRecipe {
    id: string;
    name: string;
    created_at: string;
    is_generated: boolean;
    image_url: string | null;
    product_id: string;
    prompt_json: any;
}

export default function AdRecipesPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [recipes, setRecipes] = useState<AdRecipe[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecipes = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/ad-recipes');

                if (!response.ok) {
                    if (response.status === 401) {
                        router.push('/login?redirect=/ad-recipes');
                        return;
                    }
                    throw new Error('Failed to fetch ad recipes');
                }

                const data = await response.json();
                setRecipes(data.recipes || []);
            } catch (err) {
                console.error('Error fetching ad recipes:', err);
                setError(err instanceof Error ? err.message : 'Failed to load ad recipes');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipes();
    }, [router]);

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
                    <h1 className="text-2xl font-semibold text-gray-900">Ad Recipes</h1>
                    <div className="flex space-x-3">
                        <Link
                            href="/concepts"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Ad Concepts
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                {recipes.length === 0 ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                        <p className="text-gray-500">No ad recipes found. Generate ads from your concepts.</p>
                        <div className="mt-5">
                            <Link
                                href="/concepts"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                View Concepts
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recipes.map((recipe) => (
                            <div key={recipe.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="relative h-48 w-full">
                                    {recipe.image_url ? (
                                        <Image
                                            src={recipe.image_url}
                                            alt={recipe.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-500">
                                                {recipe.is_generated ? 'Image not available' : 'Generating...'}
                                            </span>
                                        </div>
                                    )}
                                    {!recipe.is_generated && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <div className="text-white text-center">
                                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-2"></div>
                                                <p>Generating...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h2 className="text-lg font-medium text-gray-900">{recipe.name}</h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Created {new Date(recipe.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="mt-4">
                                        <Link
                                            href={`/ad-recipes/${recipe.id}`}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 