'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Ad {
    ad_archive_id: string;
    start_date: number;
    url: string;
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
    };
}

interface AdTableProps {
    ads: Ad[];
    adType: 'image' | 'video';
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

export default function AdTable({ ads, adType }: AdTableProps) {
    if (!ads || ads.length === 0) {
        return <p className="text-gray-500">No {adType} ads found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
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
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {ads.map((ad) => {
                        const mediaUrl = adType === 'video'
                            ? ad.snapshot.videos?.[0]?.video_preview_image_url
                            : ad.snapshot.cards?.[0]?.resized_image_url;
                        const mediaLink = adType === 'video'
                            ? ad.snapshot.videos?.[0]?.video_hd_url
                            : mediaUrl; // Link to the image itself for image ads
                        const bodyText = ad.snapshot.cards?.[0]?.body || ad.snapshot.body?.text || 'No text available';
                        const adLibraryLink = `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`;

                        return (
                            <tr key={ad.ad_archive_id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {mediaUrl ? (
                                        <Link href={mediaLink || '#'} target="_blank" rel="noopener noreferrer">
                                            <Image
                                                src={mediaUrl}
                                                alt="Ad Media"
                                                width={100}
                                                height={100} // Adjust height as needed, maybe aspect ratio
                                                className="object-cover rounded"
                                            />
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                                    <Link href={adLibraryLink} target="_blank" rel="noopener noreferrer">
                                        View Ad
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
} 