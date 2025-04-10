'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface JsonViewerProps {
    data: any;
    maxDepth?: number;
    initialOpenDepth?: number;
}

export default function DynamicJsonViewer({
    data,
    maxDepth = 10,
    initialOpenDepth = 1
}: JsonViewerProps) {
    const renderJsonValue = (value: any, key: string, path: string, depth: number) => {
        // Base case for recursion - don't go deeper than maxDepth
        if (depth > maxDepth) {
            return <span className="text-gray-500">...</span>;
        }

        // Handle null and undefined
        if (value === null) {
            return <span className="text-gray-500 italic">null</span>;
        }
        if (value === undefined) {
            return <span className="text-gray-500 italic">undefined</span>;
        }

        // Handle primitive types
        if (typeof value !== 'object') {
            if (typeof value === 'string') {
                return <span className="text-green-600">"{value}"</span>;
            }
            if (typeof value === 'number') {
                return <span className="text-blue-600">{value}</span>;
            }
            if (typeof value === 'boolean') {
                return <span className="text-purple-600">{value.toString()}</span>;
            }
            return <span>{String(value)}</span>;
        }

        // Handle arrays and objects
        if (Array.isArray(value)) {
            return <ArrayNode
                value={value}
                path={path}
                depth={depth}
                initiallyOpen={depth <= initialOpenDepth}
            />;
        }

        return <ObjectNode
            value={value}
            path={path}
            depth={depth}
            initiallyOpen={depth <= initialOpenDepth}
        />;
    };

    const ObjectNode = ({
        value,
        path,
        depth,
        initiallyOpen = false
    }: {
        value: object;
        path: string;
        depth: number;
        initiallyOpen: boolean;
    }) => {
        const [isOpen, setIsOpen] = useState(initiallyOpen);
        const toggleOpen = () => setIsOpen(!isOpen);
        const entries = Object.entries(value);

        if (entries.length === 0) {
            return <span className="text-gray-500">{"{}"}</span>;
        }

        return (
            <div className="pl-4">
                <div
                    className="flex items-center cursor-pointer hover:bg-gray-50 -ml-4 pl-4 pr-2 py-1 rounded"
                    onClick={toggleOpen}
                >
                    {isOpen ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-1" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-1" />
                    )}
                    <span className="text-gray-700 font-medium">
                        {"{"}
                        {!isOpen && (
                            <span className="text-gray-400 ml-1">
                                {entries.length} {entries.length === 1 ? 'item' : 'items'}
                            </span>
                        )}
                        {!isOpen && "}"}
                    </span>
                </div>

                {isOpen && (
                    <div className="ml-4 border-l-2 border-gray-200 pl-2">
                        {entries.map(([key, value], index) => (
                            <div key={`${path}.${key}`} className="py-1">
                                <div className="flex items-start">
                                    <span className="text-gray-800 font-medium mr-2">
                                        {key}:
                                    </span>
                                    <div className="flex-1">
                                        {renderJsonValue(value, key, `${path}.${key}`, depth + 1)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="-ml-6 mt-1">{" }"}</div>
                    </div>
                )}
            </div>
        );
    };

    const ArrayNode = ({
        value,
        path,
        depth,
        initiallyOpen = false
    }: {
        value: any[];
        path: string;
        depth: number;
        initiallyOpen: boolean;
    }) => {
        const [isOpen, setIsOpen] = useState(initiallyOpen);
        const toggleOpen = () => setIsOpen(!isOpen);

        if (value.length === 0) {
            return <span className="text-gray-500">{"[]"}</span>;
        }

        return (
            <div className="pl-4">
                <div
                    className="flex items-center cursor-pointer hover:bg-gray-50 -ml-4 pl-4 pr-2 py-1 rounded"
                    onClick={toggleOpen}
                >
                    {isOpen ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-1" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-1" />
                    )}
                    <span className="text-gray-700 font-medium">
                        {"["}
                        {!isOpen && (
                            <span className="text-gray-400 ml-1">
                                {value.length} {value.length === 1 ? 'item' : 'items'}
                            </span>
                        )}
                        {!isOpen && "]"}
                    </span>
                </div>

                {isOpen && (
                    <div className="ml-4 border-l-2 border-gray-200 pl-2">
                        {value.map((item, index) => (
                            <div key={`${path}[${index}]`} className="py-1">
                                <div className="flex items-start">
                                    <span className="text-gray-400 font-mono mr-2">
                                        {index}:
                                    </span>
                                    <div className="flex-1">
                                        {renderJsonValue(item, index.toString(), `${path}[${index}]`, depth + 1)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="-ml-6 mt-1">{" ]"}</div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="font-mono text-sm bg-white rounded-lg border border-gray-200 p-4 overflow-auto">
            {renderJsonValue(data, 'root', 'root', 0)}
        </div>
    );
} 