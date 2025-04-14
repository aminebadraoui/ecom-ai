'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface AdRecipe {
    id: string;
    created_at: string;
    ad_archive_id: string;
    image_url: string;
    sales_url: string;
    ad_concept_json: any;
    sales_page_json: any;
    recipe_prompt: string;
    user_id: string;
}

export default function AdRecipesPage() {
    const [recipes, setRecipes] = useState<AdRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<AdRecipe | null>(null);
    const [showRecipeModal, setShowRecipeModal] = useState(false);

    useEffect(() => {
        const fetchRecipes = async () => {
            setIsLoading(true);
            try {
                // Fetch from API endpoint instead of directly from Supabase
                const response = await fetch('/api/ad-recipes');

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setRecipes(data.recipes || []);
            } catch (err) {
                console.error('Error fetching ad recipes:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                toast.error('Failed to load ad recipes');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipes();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const openRecipeModal = (recipe: AdRecipe) => {
        setSelectedRecipe(recipe);
        setShowRecipeModal(true);
    };

    const closeRecipeModal = () => {
        setShowRecipeModal(false);
        setSelectedRecipe(null);
    };

    // Render recipe detail modal
    const renderRecipeModal = () => {
        if (!showRecipeModal || !selectedRecipe) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Ad Recipe for {selectedRecipe.ad_archive_id}</h3>
                            <button
                                onClick={closeRecipeModal}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="overflow-auto p-6 flex-grow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Ad Image</h4>
                                {selectedRecipe.image_url ? (
                                    <div className="relative h-64 w-full mb-4">
                                        <Image
                                            src={selectedRecipe.image_url}
                                            alt="Ad"
                                            fill
                                            className="object-contain rounded"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-64 w-full bg-gray-100 rounded flex items-center justify-center mb-4">
                                        <span className="text-sm text-gray-500">No image available</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-gray-900">Ad ID</h5>
                                    <p className="text-sm text-gray-500">{selectedRecipe.ad_archive_id}</p>
                                    <a
                                        href={`https://www.facebook.com/ads/library/?id=${selectedRecipe.ad_archive_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-indigo-600 hover:text-indigo-900 text-sm"
                                    >
                                        View Original Ad
                                    </a>

                                    <h5 className="text-sm font-medium text-gray-900 mt-4">Product URL</h5>
                                    <a
                                        href={selectedRecipe.sales_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-900 text-sm break-all"
                                    >
                                        {selectedRecipe.sales_url}
                                    </a>
                                </div>
                            </div>

                            {selectedRecipe.recipe_prompt && (
                                <div className="h-full">
                                    <h4 className="font-medium text-gray-900 mb-2">Recipe Prompt</h4>
                                    <div className="overflow-auto bg-white border border-gray-200 p-4 rounded h-[calc(100%-2rem)]">
                                        <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {selectedRecipe.recipe_prompt}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200">
                        <button
                            onClick={closeRecipeModal}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Close
                        </button>
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
                        <p className="text-center">Loading ad recipes...</p>
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
                            Try Again
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
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {recipes.length === 0 ? (
                    <div className="bg-white shadow sm:rounded-lg p-8 text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No ad recipes yet</h3>
                        <p className="text-gray-500 mb-6">
                            Generate ad recipes from your projects to see them here.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Go to Projects
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ad Image
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ad ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product URL
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recipes.map((recipe) => (
                                    <tr key={recipe.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative h-16 w-16 flex-shrink-0">
                                                {recipe.image_url ? (
                                                    <Image
                                                        src={recipe.image_url}
                                                        alt="Ad"
                                                        fill
                                                        className="object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                                                        <span className="text-xs text-gray-500">No image</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                <a
                                                    href={`https://www.facebook.com/ads/library/?id=${recipe.ad_archive_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {recipe.ad_archive_id}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {formatDate(recipe.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 truncate max-w-xs">
                                                <a
                                                    href={recipe.sales_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {recipe.sales_url}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => openRecipeModal(recipe)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                View Recipe
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {renderRecipeModal()}
            </div>
        </div>
    );
} 