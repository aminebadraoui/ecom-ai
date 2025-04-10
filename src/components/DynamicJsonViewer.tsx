'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface JsonViewerProps {
    data: any;
    initialDepth?: number;
    maxDepth?: number;
    expandAll?: boolean;
    name?: string;
    path?: string;
}

const DynamicJsonViewer: React.FC<JsonViewerProps> = ({
    data,
    initialDepth = 1,
    maxDepth = 10,
    expandAll = false,
    name = '',
    path = '',
}) => {
    // Check if value is an object or array and not null
    const isExpandable = (value: any) =>
        value !== null && (typeof value === 'object' || Array.isArray(value));

    // Generate a unique path for each node
    const getNodePath = (currentPath: string, key: string) =>
        currentPath ? `${currentPath}.${key}` : key;

    // Calculate current depth from path
    const currentDepth = path ? path.split('.').length : 0;

    // Create collapsed state based on depth and expandAll prop
    const [isOpen, setIsOpen] = useState(currentDepth < initialDepth || expandAll);

    if (!isExpandable(data)) {
        // Render primitive values
        return (
            <div className="flex items-start">
                {name && <span className="font-medium text-blue-600 mr-2">{name}:</span>}
                <span className={typeof data === 'string' ? 'text-green-600' : 'text-amber-600'}>
                    {typeof data === 'string' ? `"${data}"` : String(data)}
                </span>
            </div>
        );
    }

    // For objects and arrays
    const toggleOpen = () => setIsOpen(!isOpen);
    const isArray = Array.isArray(data);

    return (
        <div className="ml-1">
            <div className="flex items-center cursor-pointer my-1" onClick={toggleOpen}>
                <span className="text-gray-500 mr-1">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                {name && <span className="font-medium text-blue-600 mr-2">{name}:</span>}
                <span className="text-gray-500">
                    {isArray ? '[' : '{'}
                    {!isOpen && '...'}
                    {!isOpen && (isArray ? ']' : '}')}
                </span>
            </div>

            {isOpen && (
                <div className="ml-4 border-l-2 border-gray-200 pl-3">
                    {Object.keys(data).map((key) => (
                        <div key={key} className="my-1">
                            {currentDepth + 1 <= maxDepth ? (
                                <DynamicJsonViewer
                                    data={data[key]}
                                    initialDepth={initialDepth}
                                    maxDepth={maxDepth}
                                    expandAll={expandAll}
                                    name={key}
                                    path={getNodePath(path, key)}
                                />
                            ) : (
                                <div className="flex">
                                    <span className="font-medium text-blue-600 mr-2">{key}:</span>
                                    <span className="text-gray-500">[Maximum depth reached]</span>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="text-gray-500">{isArray ? ']' : '}'}</div>
                </div>
            )}
        </div>
    );
};

export default DynamicJsonViewer; 