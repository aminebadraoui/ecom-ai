'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Workflow {
    id: string;
    name: string;
    created_at: string;
    user_id: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();

                if (!data.user) {
                    router.push('/login?redirect=/dashboard');
                    return;
                }

                setUser(data.user);
                await fetchWorkflows();
            } catch (error) {
                console.error('Failed to check authentication status:', error);
                setError('Failed to authenticate. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const fetchWorkflows = async () => {
        try {
            const response = await fetch('/api/workflows');

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch workflows');
            }

            const data = await response.json();
            setWorkflows(data.workflows || []);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch workflows');
        }
    };

    const handleDeleteWorkflow = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workflow?')) {
            return;
        }

        try {
            const response = await fetch(`/api/workflows/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete workflow');
            }

            // Refresh workflows
            await fetchWorkflows();
        } catch (error) {
            console.error('Error deleting workflow:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete workflow');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="px-4 sm:px-0">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name || user?.email || 'User'}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Here's an overview of your Facebook Ad Scraper workflows
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Recent Workflows</h2>
                        <Link
                            href="/projects/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            New Workflow
                        </Link>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {workflows.length === 0 ? (
                            <div className="px-4 py-5 sm:p-6 text-center">
                                <p className="text-gray-500">No workflows yet. Create one to get started!</p>
                                <div className="mt-5">
                                    <Link
                                        href="/projects/new"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Create your first workflow
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {workflows.map((workflow) => (
                                    <li key={workflow.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <Link
                                                    href={`/projects/${workflow.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                >
                                                    {workflow.name}
                                                </Link>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Created: {new Date(workflow.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex">
                                                <Link
                                                    href={`/projects/${workflow.id}`}
                                                    className="mr-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteWorkflow(workflow.id)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900">Scrape New Ads</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Start scraping Facebook ads from competitors
                                </p>
                                <div className="mt-4">
                                    <Link
                                        href="/projects/new"
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 