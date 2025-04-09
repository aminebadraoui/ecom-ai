'use client';

import { useState, useEffect } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                setIsAuthenticated(!!data.user);
            } catch (error) {
                console.error('Failed to check authentication status:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname]); // Re-check when pathname changes

    // Public paths that don't need the sidebar
    const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/';

    // Don't render layout while checking auth
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // For public pages or when not authenticated, just render the children without sidebar
    if (!isAuthenticated && !isPublicPath) {
        return <>{children}</>;
    }

    // For authenticated users and public pages, render with sidebar
    return (
        <div className="min-h-screen bg-white">
            {(isAuthenticated || isPublicPath) && <Sidebar isAuthenticated={isAuthenticated} />}

            <div className={isAuthenticated ? "lg:pl-72" : ""}>
                {isAuthenticated && (
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        {/* Separator */}
                        <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1" />
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                {/* Profile dropdown can be added here */}
                            </div>
                        </div>
                    </div>
                )}

                <main className="py-10 bg-white">
                    <div className="px-4 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
} 