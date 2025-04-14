'use client';

import { useState, useMemo, useEffect } from 'react';
import AdTable from '../../components/AdTable';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { generateAdRecipe, subscribeToTaskStream } from '@/lib/adRemixerClient';
import { getUserId } from '@/lib/auth-client';

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
    ad_recipe?: {
        id: string;
        status: 'pending' | 'completed' | 'failed';
    };
}

interface Product {
    id: string;
    user_id: string;
    name: string;
    sales_url: string;
    details_json: any;
    created_at?: string;
    updated_at?: string;
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
    adsInProgress: string[];
}

// Add a new interface for recipe tasks
interface RecipeTask {
    adId: string;
    taskId: string;
    status: 'pending' | 'completed' | 'failed';
    adImageUrl?: string;
    adName?: string;
    result?: any;
}

export default function ProjectPage({ params }: { params: PageParams }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ActiveTab>('image');
    const [ads, setAds] = useState<Ad[]>([]);
    const [workflowName, setWorkflowName] = useState<string>('');
    const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
    const { id } = params;
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [country, setCountry] = useState('US');
    const [language, setLanguage] = useState('en');
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [newProductUrl, setNewProductUrl] = useState<string>('');
    const [showNewProductForm, setShowNewProductForm] = useState(false);
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
        name: '',
        sales_url: '',
        details_json: {}
    });
    const [adsInProgress, setAdsInProgress] = useState<string[]>([]);
    const [recipeTasks, setRecipeTasks] = useState<RecipeTask[]>([]);
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<RecipeTask | null>(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

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
                    setAds(data.workflow.ads || []);
                }

                // Setup default product
                setProducts([
                    {
                        id: 'direct-product',
                        user_id: 'direct-user',
                        name: 'Direct Product',
                        sales_url: '',
                        details_json: {}
                    }
                ]);

            } catch (err) {
                console.error('Error fetching workflow:', err);
                setError(err instanceof Error ? err.message : 'Failed to load workflow');
            }
            setIsLoading(false);
        };

        fetchWorkflow();
    }, [id, router]);

    // New useEffect to handle recipe task tracking with localStorage
    useEffect(() => {
        // Load tasks from localStorage on mount
        const savedTasks = localStorage.getItem('recipeTasks');
        if (savedTasks) {
            try {
                const parsedTasks = JSON.parse(savedTasks);
                setRecipeTasks(parsedTasks);

                // Set up streaming for pending tasks
                const pendingTasks = parsedTasks.filter((task: RecipeTask) => task.status === 'pending');
                pendingTasks.forEach((task: RecipeTask) => {
                    subscribeToTaskStream(task.taskId, task.adId, task.adImageUrl || '', task.adName || '');
                });
            } catch (e) {
                console.error('Error parsing saved tasks:', e);
            }
        }
    }, []);

    // Save tasks to localStorage when they change
    useEffect(() => {
        if (recipeTasks.length > 0) {
            localStorage.setItem('recipeTasks', JSON.stringify(recipeTasks));
        }
    }, [recipeTasks]);

    // Function to subscribe to task stream
    const subscribeToTaskStream = (taskId: string, adId: string, adImageUrl: string, adName: string) => {
        const eventSource = new EventSource(`https://ai.adremixer.com/api/v1/tasks/${taskId}/stream`);

        eventSource.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log('Stream data:', data);

            if (data.status === 'completed') {
                // Update the task status in our state
                setRecipeTasks(prev => prev.map(task =>
                    task.taskId === taskId
                        ? { ...task, status: 'completed', result: data.result }
                        : task
                ));

                // Save the recipe to Supabase
                saveRecipeToSupabase(adId, adImageUrl, data.result);

                eventSource.close();

                toast.success(
                    <div className="flex items-center space-x-2">
                        <span>Recipe generated successfully!</span>
                        <button
                            onClick={() => {
                                // Find the task
                                const task = recipeTasks.find(t => t.taskId === taskId);
                                if (task) {
                                    setSelectedTask(task);
                                    setShowTaskDetailModal(true);
                                }
                            }}
                            className="ml-2 text-white bg-indigo-600 px-2 py-1 rounded text-xs"
                        >
                            View
                        </button>
                    </div>,
                    { duration: 5000 }
                );
            } else if (data.status === 'failed') {
                // Update as failed
                setRecipeTasks(prev =>
                    prev.map(t =>
                        t.taskId === taskId
                            ? { ...t, status: 'failed' }
                            : t
                    )
                );

                // Update UI
                setAdsInProgress(prev => prev.filter(id => id !== adId));
                toast.error(`Recipe for ad ${adId} failed to generate`);

                // Close the stream
                eventSource.close();
            }
        };

        eventSource.addEventListener('error', () => {
            console.error(`Error in task stream for task ${taskId}`);
            eventSource.close();
        });

        return eventSource;
    };

    // Function to save recipe to Supabase
    const saveRecipeToSupabase = async (adId: string, adImageUrl: string, result: any) => {
        try {
            // Extract the needed data from the result
            const recipeData = {
                ad_archive_id: adId,
                image_url: adImageUrl,
                sales_url: newProductUrl, // Use the current product URL
                ad_concept_json: result.adConcept || {},
                sales_page_json: result.salesPage || {},
                recipe_prompt: result.prompt || '',
            };

            console.log('Saving recipe to Supabase:', recipeData);

            // Insert into Supabase
            const { data, error } = await supabase
                .from('ad_recipes')
                .insert(recipeData);

            if (error) {
                console.error('Error saving recipe to Supabase:', error);
                toast.error('Failed to save recipe to database');
                return;
            }

            console.log('Recipe saved successfully:', data);
            toast.success('Recipe saved to database', { id: 'save-success' });
        } catch (err) {
            console.error('Error in saveRecipeToSupabase:', err);
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

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newProduct.name || !newProduct.sales_url) {
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
                sales_url: '',
                details_json: {}
            });
            setShowNewProductForm(false);
            setNewProductUrl('');

            toast.success('Product created successfully');
        } catch (err) {
            console.error('Error creating product:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to create product');
        }
    };

    const handleGenerateAdRecipes = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent | undefined) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (selectedAds.length === 0) {
            setError('Please select at least one ad to generate recipe');
            return;
        }

        // Always show product selector when generating recipes
        if (!newProductUrl) {
            setShowProductSelector(true);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setSuccess(null);

        // Keep track of ads in progress
        const adIdsToProcess = selectedAds.map(ad => ad.ad_archive_id);
        setAdsInProgress(prev => [...prev, ...adIdsToProcess]);

        try {
            // Use only the provided product URL - no local API calls
            const productUrl = newProductUrl;

            // Process each ad and call the external API directly
            const recipePromises = selectedAds.map(async (ad) => {
                try {
                    // Get ad image URL
                    const adImageUrl = ad.snapshot?.cards?.find((card: any) => card.resized_image_url)?.resized_image_url ||
                        ad.snapshot?.images?.[0]?.resized_image_url ||
                        ad.snapshot?.videos?.[0]?.video_preview_image_url || '';

                    if (!adImageUrl) {
                        throw new Error(`No image URL found for ad ${ad.ad_archive_id}`);
                    }

                    // Just call the external API directly - nothing else
                    const adRemixerResponse = await fetch('https://ai.adremixer.com/api/v1/generate-ad-recipe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ad_archive_id: ad.ad_archive_id,
                            image_url: adImageUrl,
                            sales_url: productUrl,
                            user_id: 'direct-user' // Simple fixed value
                        }),
                    });

                    if (!adRemixerResponse.ok) {
                        const errorData = await adRemixerResponse.json();
                        throw new Error(`AdRemixer API error: ${errorData.error || adRemixerResponse.statusText}`);
                    }

                    const adRemixerData = await adRemixerResponse.json();

                    // Just log the task ID
                    console.log(`Started generation for ad ${ad.ad_archive_id}, task ID: ${adRemixerData.task_id}`);

                    // Log result and update UI
                    console.log(`Recipe generation started: ${JSON.stringify(adRemixerData)}`);

                    // Create a new task and add it to our state
                    const newTask: RecipeTask = {
                        adId: ad.ad_archive_id,
                        taskId: adRemixerData.task_id,
                        status: 'pending',
                        adImageUrl: adImageUrl,
                        adName: ad.page_name || 'Unknown'
                    };

                    setRecipeTasks(prev => [...prev, newTask]);

                    // Start streaming for this task
                    subscribeToTaskStream(adRemixerData.task_id, ad.ad_archive_id, adImageUrl, ad.page_name || '');

                    return {
                        adId: ad.ad_archive_id,
                        taskId: adRemixerData.task_id
                    };
                } catch (apiError) {
                    console.error(`Error generating recipe for ad ${ad.ad_archive_id}:`, apiError);
                    setAdsInProgress(prev => prev.filter(id => id !== ad.ad_archive_id));
                    return null;
                }
            });

            // Wait for all API calls to be initiated
            const generationTasks = await Promise.all(recipePromises);
            const validTasks = generationTasks.filter(Boolean);

            setSuccess(`Started generating ${validTasks.length} ad recipe(s) directly with AdRemixer API`);
            setShowProductSelector(false);

            // Reset selection
            setSelectedAds([]);

            toast.success(
                <div>
                    Ad recipe generation started! <button
                        onClick={() => setShowTasksModal(true)}
                        className="ml-2 text-white bg-indigo-600 px-2 py-1 rounded text-xs"
                    >
                        View Tasks
                    </button>
                </div>,
                { duration: 5000 }
            );
        } catch (err) {
            console.error('Error generating ad recipes:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate ad recipes');
            setAdsInProgress([]);
        } finally {
            setIsGenerating(false);
        }
    };

    // Banner content for tasks in progress
    const renderTasksBanner = () => {
        if (adsInProgress.length === 0) {
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
                            {adsInProgress.length === 1 ? (
                                <>Generating recipe for ad {adsInProgress[0]}...</>
                            ) : (
                                <>
                                    Generating {adsInProgress.length} recipes...
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Product selector modal
    const renderProductSelector = () => {
        if (!showProductSelector) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Enter Product URL</h3>
                            <button
                                onClick={() => setShowProductSelector(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="px-6 py-4">
                        <div className="mb-4">
                            <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700">
                                Product URL *
                            </label>
                            <input
                                type="url"
                                id="productUrl"
                                name="productUrl"
                                value={newProductUrl}
                                onChange={(e) => setNewProductUrl(e.target.value)}
                                placeholder="https://example.com/product"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This URL will be sent directly to the external API
                            </p>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 text-right">
                        <button
                            onClick={() => setShowProductSelector(false)}
                            className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerateAdRecipes}
                            disabled={!newProductUrl}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${!newProductUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                        >
                            Generate
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render tasks modal
    const renderTasksModal = () => {
        if (!showTasksModal) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Ad Recipe Tasks</h3>
                            <button
                                onClick={() => setShowTasksModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="overflow-auto flex-grow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ad ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ad Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recipeTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No tasks yet
                                        </td>
                                    </tr>
                                ) : (
                                    recipeTasks.map((task) => (
                                        <tr key={task.taskId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {task.adId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {task.adImageUrl ? (
                                                    <div className="h-16 w-16 relative">
                                                        <img
                                                            src={task.adImageUrl}
                                                            alt="Ad"
                                                            className="h-full w-full object-cover rounded"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                                                        <span className="text-xs text-gray-500">No image</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : task.status === 'failed'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {task.status === 'pending' && (
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    )}
                                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        if (task.status === 'completed') {
                                                            setSelectedTask(task);
                                                            setShowTaskDetailModal(true);
                                                        } else if (task.status === 'pending') {
                                                            window.open(`https://ai.adremixer.com/api/v1/tasks/${task.taskId}/status`, '_blank');
                                                        }
                                                    }}
                                                    disabled={task.status === 'failed'}
                                                    className={`${task.status === 'completed'
                                                        ? 'text-indigo-600 hover:text-indigo-900'
                                                        : task.status === 'pending'
                                                            ? 'text-yellow-600 hover:text-yellow-900'
                                                            : 'text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {task.status === 'completed' ? 'View Recipe' : task.status === 'pending' ? 'Check Status' : 'Failed'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowTasksModal(false)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render task detail modal
    const renderTaskDetailModal = () => {
        if (!showTaskDetailModal || !selectedTask) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Ad Recipe for {selectedTask.adId}</h3>
                            <button
                                onClick={() => {
                                    setShowTaskDetailModal(false);
                                    setSelectedTask(null);
                                }}
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
                                <h4 className="font-medium text-gray-900 mb-2">Original Ad</h4>
                                {selectedTask.adImageUrl ? (
                                    <div className="relative h-64 w-full mb-4">
                                        <img
                                            src={selectedTask.adImageUrl}
                                            alt="Ad"
                                            className="h-full w-full object-contain rounded"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-64 w-full bg-gray-100 rounded flex items-center justify-center mb-4">
                                        <span className="text-sm text-gray-500">No image available</span>
                                    </div>
                                )}
                                <a
                                    href={`https://www.facebook.com/ads/library/?id=${selectedTask.adId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                                >
                                    View Original Ad in Facebook Ads Library
                                </a>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Recipe</h4>
                                {selectedTask.result ? (
                                    <div className="overflow-auto bg-gray-50 p-4 rounded max-h-[500px]">
                                        <pre className="text-xs whitespace-pre-wrap">
                                            {JSON.stringify(selectedTask.result, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="h-64 w-full bg-gray-100 rounded flex items-center justify-center">
                                        <span className="text-sm text-gray-500">No recipe data available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedTask.result?.recipe_prompt && (
                            <div className="mt-6">
                                <h4 className="font-medium text-gray-900 mb-2">Recipe Prompt</h4>
                                <div className="overflow-auto bg-gray-50 p-4 rounded max-h-[300px]">
                                    <pre className="text-xs whitespace-pre-wrap">
                                        {selectedTask.result.recipe_prompt}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                        <button
                            onClick={() => {
                                setShowTaskDetailModal(false);
                                setSelectedTask(null);
                            }}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Close
                        </button>
                        <a
                            href={`https://ai.adremixer.com/api/v1/tasks/${selectedTask.taskId}/result`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            View Raw Result
                        </a>
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
                {renderProductSelector()}
                {renderTasksModal()}
                {renderTaskDetailModal()}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">{workflowName}</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowTasksModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            View Recipe Tasks
                            {recipeTasks.filter(t => t.status === 'pending').length > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white text-indigo-600">
                                    {recipeTasks.filter(t => t.status === 'pending').length}
                                </span>
                            )}
                        </button>
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
                            className={`${activeTab === 'image'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('image')}
                        >
                            Image Ads
                        </button>
                        <button
                            className={`${activeTab === 'video'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            onClick={() => setActiveTab('video')}
                        >
                            Video Ads
                        </button>
                    </nav>
                </div>

                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    {activeTab === 'image' && (
                        <AdTable
                            ads={filteredAds}
                            adType="image"
                            selectable={true}
                            onSelectionChange={handleSelectionChange}
                            adsInProgress={adsInProgress}
                        />
                    )}

                    {activeTab === 'video' && (
                        <AdTable
                            ads={filteredAds}
                            adType="video"
                            selectable={true}
                            onSelectionChange={handleSelectionChange}
                            adsInProgress={adsInProgress}
                        />
                    )}
                </div>

                {selectedAds.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 border-t border-gray-200">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                                {selectedAds.length} ad{selectedAds.length !== 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={() => setShowProductSelector(true)}
                                disabled={isGenerating}
                                className={clsx(
                                    'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                                    isGenerating && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Ad Recipe'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 