'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';


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

interface AdTableProps {
    ads: Ad[];
    adType: 'image' | 'video';
    selectable: boolean;
    onSelectionChange: (ads: Ad[]) => void;
    adsInProgress: string[];
}

function formatDate(timestamp: number): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function AdTable({
    ads,
    adType,
    selectable = false,
    onSelectionChange,
    adsInProgress = []
}: AdTableProps) {
    const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    if (!ads || ads.length === 0) {
        return <p className="text-gray-500">No {adType} ads found.</p>;
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedAdIds([]);
        } else {
            setSelectedAdIds(ads.map(ad => ad.ad_archive_id));
        }
        setSelectAll(!selectAll);

        if (onSelectionChange) {
            if (!selectAll) {
                onSelectionChange(ads);
            } else {
                onSelectionChange([]);
            }
        }
    };

    const handleSelectAd = (adId: string) => {
        let newSelectedIds;
        if (selectedAdIds.includes(adId)) {
            newSelectedIds = selectedAdIds.filter(id => id !== adId);
        } else {
            newSelectedIds = [...selectedAdIds, adId];
        }

        setSelectedAdIds(newSelectedIds);
        setSelectAll(newSelectedIds.length === ads.length);

        if (onSelectionChange) {
            const selectedAds = ads.filter(ad => newSelectedIds.includes(ad.ad_archive_id));
            onSelectionChange(selectedAds);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {selectable && (
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                            </th>
                        )}
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Media
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Body Text
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Start Date
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Ad Library Link
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {ads.map((ad) => {
                        // Get the first available media URL
                        const mediaUrl = adType === 'video'
                            ? ad.snapshot?.videos?.[0]?.video_preview_image_url
                            : (ad.snapshot?.cards?.find(card => card.resized_image_url)?.resized_image_url ||
                                ad.snapshot?.images?.[0]?.resized_image_url);

                        // Get the link URL (video URL for videos, image URL for images)
                        const mediaLink = adType === 'video'
                            ? ad.snapshot?.videos?.[0]?.video_hd_url || '#'
                            : mediaUrl || '#';

                        // Get body text from either cards or main body
                        const bodyText = ad.snapshot?.cards?.find(card => card.body)?.body ||
                            ad.snapshot?.body?.text ||
                            'No text available';

                        const adLibraryLink = `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`;
                        const isSelected = selectedAdIds.includes(ad.ad_archive_id);
                        const isAdInProgress = adsInProgress.includes(ad.ad_archive_id);

                        // Check if we have ad recipe data
                        const recipeExists = !!ad.ad_recipe;
                        const recipeStatus = ad.ad_recipe?.status || null;

                        return (
                            <tr
                                key={ad.ad_archive_id}
                                className={isSelected && selectable ? "bg-indigo-50" : ""}
                                onClick={(e) => {
                                    // Only prevent default if clicking on the row itself, not on buttons or links
                                    if (e.target === e.currentTarget) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    }
                                }}
                            >
                                {selectable && (
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectAd(ad.ad_archive_id)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {mediaUrl ? (
                                        <Link href={mediaLink} target="_blank" rel="noopener noreferrer">
                                            <div className="relative w-[100px] h-[100px]">
                                                <Image
                                                    src={mediaUrl}
                                                    alt="Ad Media"
                                                    fill
                                                    className="object-cover rounded"
                                                />
                                                {adType === 'video' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="w-[100px] h-[100px] bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                            No Media
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-md overflow-hidden whitespace-pre-wrap">
                                        {bodyText.substring(0, 200)}{bodyText.length > 200 ? '...' : ''}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(ad.start_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <a
                                        href={adLibraryLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        View in Ad Library
                                    </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {isAdInProgress ? (
                                        <div className="flex items-center">
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
                                            <span className="text-indigo-600">Generating recipe...</span>
                                        </div>
                                    ) : recipeExists ? (
                                        <div className="text-green-600">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Recipe {recipeStatus === 'completed' ? 'Ready' : recipeStatus}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">No recipe</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
} 