'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    ChartBarIcon,
    MagnifyingGlassIcon,
    Cog6ToothIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';

const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Ad Scraper', href: '/projects/new', icon: MagnifyingGlassIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile sidebar */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/80" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                                    <div className="flex h-16 shrink-0 items-center">
                                        <span className="text-xl font-bold text-gray-900">Ecom AI</span>
                                    </div>
                                    <nav className="flex flex-1 flex-col">
                                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                            <li>
                                                <ul role="list" className="-mx-2 space-y-1">
                                                    {navigation.map((item) => (
                                                        <li key={item.name}>
                                                            <Link
                                                                href={item.href}
                                                                className={clsx(
                                                                    pathname === item.href
                                                                        ? 'bg-indigo-50 text-indigo-600'
                                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
                                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                                                                )}
                                                            >
                                                                <item.icon
                                                                    className={clsx(
                                                                        pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                                        'h-6 w-6 shrink-0 transition-colors'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                        <span className="text-xl font-bold text-gray-900">Ecom AI</span>
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={clsx(
                                                    pathname === item.href
                                                        ? 'bg-indigo-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                                                )}
                                            >
                                                <item.icon
                                                    className={clsx(
                                                        pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                        'h-6 w-6 shrink-0 transition-colors'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className="mt-auto">
                                <Link
                                    href="/profile"
                                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                >
                                    <UserIcon
                                        className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600 transition-colors"
                                        aria-hidden="true"
                                    />
                                    Profile
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    );
} 