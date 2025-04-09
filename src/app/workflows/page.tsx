'use client';

import { useState, useEffect } from 'react';

interface Workflow {
    id: string;
    name: string;
    createdAt: string;
    ads: any[];
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedWorkflows = localStorage.getItem('workflows');
            if (savedWorkflows) {
                setWorkflows(JSON.parse(savedWorkflows));
            }
        }
    }, []);

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <h1 className="text-2xl font-semibold text-gray-900">Saved Workflows</h1>
                <div className="mt-6">
                    {workflows.length === 0 ? (
                        <p className="text-gray-500">No workflows saved yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {workflows.map((workflow) => (
                                <div
                                    key={workflow.id}
                                    className="bg-white overflow-hidden shadow rounded-lg"
                                >
                                    <div className="px-4 py-5 sm:p-6">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {workflow.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Created: {new Date(workflow.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {workflow.ads.length} ads
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 