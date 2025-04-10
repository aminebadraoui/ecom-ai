'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Workflow {
    id: string;
    name: string;
    created_at: string;
    user_id: string;
    ads?: any[];
    description?: string;
    status?: string;
    settings?: {
        target_countries?: string[];
        languages?: string[];
        date_range?: {
            start?: string;
            end?: string;
        };
        search_terms?: string[];
        [key: string]: any;
    };
    last_updated?: string;
    [key: string]: any;
}

interface AdSummary {
    type: 'image' | 'video';
    count: number;
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adsSummary, setAdsSummary] = useState<AdSummary[]>([]);
    const { id } = params;

    useEffect(() => {
        const fetchWorkflow = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/workflows/${id}`);

                if (!response.ok) {
                    if (response.status === 401) {
                        router.push('/login?redirect=/workflows/' + id);
                        return;
                    }

                    if (response.status === 403) {
                        setError('You do not have permission to view this workflow');
                        return;
                    }

                    throw new Error('Failed to fetch workflow');
                }

                const data = await response.json();
                if (data.workflow) {
                    setWorkflow(data.workflow);

                    // Calculate ad summary if ads exist
                    if (data.workflow.ads && data.workflow.ads.length > 0) {
                        const imageAds = data.workflow.ads.filter((ad: any) =>
                            (ad.snapshot?.videos === null || ad.snapshot?.videos?.length === 0) &&
                            ad.snapshot?.cards?.[0]?.resized_image_url
                        );

                        const videoAds = data.workflow.ads.filter((ad: any) =>
                            ad.snapshot?.videos?.length > 0
                        );

                        setAdsSummary([
                            { type: 'image', count: imageAds.length },
                            { type: 'video', count: videoAds.length }
                        ]);
                    }
                } else {
                    setError('Workflow not found');
                }
            } catch (err) {
                console.error('Error fetching workflow:', err);
                setError(err instanceof Error ? err.message : 'Failed to load workflow');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkflow();
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="text-indigo-600 hover:text-indigo-900"
                >
                    &larr; Back to Dashboard
                </Link>
            </div>
        );
    }

    if (!workflow) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-1">
                            <p className="text-sm text-yellow-700">Workflow not found</p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="text-indigo-600 hover:text-indigo-900"
                >
                    &larr; Back to Dashboard
                </Link>
            </div>
        );
    }

    const formatDateIfExists = (dateString?: string) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
                    {workflow.description && (
                        <p className="mt-1 text-gray-500">{workflow.description}</p>
                    )}
                </div>
                <div className="flex space-x-4">
                    <Link
                        href={`/projects/${workflow.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Edit in Projects
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Overview</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Created on {formatDateIfExists(workflow.created_at)}
                        {workflow.last_updated && ` · Last updated on ${formatDateIfExists(workflow.last_updated)}`}
                    </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-gray-50 overflow-hidden rounded-lg shadow-sm border border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                                <dd className="mt-1">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                                            workflow.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {workflow.status || 'Active'}
                                    </div>
                                </dd>
                            </div>
                        </div>

                        <div className="bg-gray-50 overflow-hidden rounded-lg shadow-sm border border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Ads</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {workflow.ads?.length || 0}
                                </dd>
                            </div>
                        </div>

                        <div className="bg-gray-50 overflow-hidden rounded-lg shadow-sm border border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">ID</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-600 break-all">
                                    {workflow.id}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {adsSummary.length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Ad Types</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {adsSummary.map((summary) => (
                                <div key={summary.type} className="bg-gray-50 overflow-hidden rounded-lg shadow-sm border border-gray-200">
                                    <div className="px-4 py-5 sm:p-6">
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {summary.type === 'image' ? 'Image Ads' : 'Video Ads'}
                                        </dt>
                                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                            {summary.count}
                                        </dd>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {workflow.settings && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Search Settings</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            {workflow.settings.target_countries && workflow.settings.target_countries.length > 0 && (
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Target Countries</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {workflow.settings.target_countries.join(', ')}
                                    </dd>
                                </div>
                            )}

                            {workflow.settings.languages && workflow.settings.languages.length > 0 && (
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Languages</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {workflow.settings.languages.join(', ')}
                                    </dd>
                                </div>
                            )}

                            {workflow.settings.date_range && (
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Date Range</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {workflow.settings.date_range.start ? formatDateIfExists(workflow.settings.date_range.start) : 'Any time'}
                                        {workflow.settings.date_range.end ? ` to ${formatDateIfExists(workflow.settings.date_range.end)}` : ''}
                                    </dd>
                                </div>
                            )}

                            {workflow.settings.search_terms && workflow.settings.search_terms.length > 0 && (
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Search Terms</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <div className="flex flex-wrap gap-2">
                                            {workflow.settings.search_terms.map((term, index) => (
                                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                                                    {term}
                                                </span>
                                            ))}
                                        </div>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-between">
                <Link
                    href="/dashboard"
                    className="text-indigo-600 hover:text-indigo-900"
                >
                    &larr; Back to Dashboard
                </Link>
                <Link
                    href={`/projects/${workflow.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                >
                    Go to Project Editor &rarr;
                </Link>
            </div>
        </div>
    );
} 