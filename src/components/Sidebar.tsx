import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
                <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                    alt="Your Company"
                />
            </div>
            <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1" aria-label="Sidebar">
                    <Link
                        href="/projects"
                        className={clsx(
                            pathname === '/projects'
                                ? 'bg-gray-50 text-indigo-600'
                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                    >
                        <svg
                            className={clsx(
                                pathname === '/projects'
                                    ? 'text-indigo-500'
                                    : 'text-gray-400 group-hover:text-indigo-500',
                                'mr-3 flex-shrink-0 h-6 w-6'
                            )}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                            />
                        </svg>
                        Projects
                    </Link>
                    <Link
                        href="/workflows"
                        className={clsx(
                            pathname === '/workflows'
                                ? 'bg-gray-50 text-indigo-600'
                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                    >
                        <svg
                            className={clsx(
                                pathname === '/workflows'
                                    ? 'text-indigo-500'
                                    : 'text-gray-400 group-hover:text-indigo-500',
                                'mr-3 flex-shrink-0 h-6 w-6'
                            )}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                            />
                        </svg>
                        Workflows
                    </Link>
                </nav>
            </div>
        </div>
    );
} 