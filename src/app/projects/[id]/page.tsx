'use client';

import { useState, useMemo, useEffect } from 'react';
import AdTable from '../../components/AdTable';
import clsx from 'clsx';

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
    };
}

type ActiveTab = 'image' | 'video';

interface PageParams {
    id: string;
}

export default function ProjectPage({ params }: { params: PageParams }) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('image');
    const [ads, setAds] = useState<Ad[]>([]);
    const [pageName, setPageName] = useState<string>('');
    const { id } = params;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [country, setCountry] = useState('');
    const [language, setLanguage] = useState('');

    // Mock data for testing
    const mockAds: Ad[] = [
        {
            "ad_archive_id": "486517397763120",
            "start_date": 1744009200,
            "url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=vibriance&search_type=keyword_unordered",
            "page_name": "Vibriance Eye Renewal Serum",
            "snapshot": {
                "body": {
                    "text": "{{product.brand}}"
                },
                "cards": [
                    {
                        "body": "\"The first time I used it I noticed my eye bags looked a lot smaller. Shortly after I saw my dark circles were lighter, I'm shocked how well this worked!\"\n\nCathy O. - Eye Renewal Serum Customer\n\nExclusively made for your 50's, 60's, 70's and beyond…\n\nVibriance Eye Renewal Serum rejuvenates skin under eyes for a well-rested appearance.\n\nThis multi-tasking eye serum replaces 3 products. It's your tightening, brightening, and wrinkle-reducing treatment all-in-one.\n\nIt can reduce the appearance of under-eye bags the very first time you use it!\n\nExperience the Vibriance difference today:\n\nhttps://secure.vibriance.com/",
                        "resized_image_url": "https://scontent.fkwi3-2.fna.fbcdn.net/v/t39.35426-6/462046481_2239039966461422_6503903250882923093_n.jpg?stp=dst-jpg_s600x600_tt6&_nc_cat=104&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=IgAHPHT2hkAQ7kNvwF6gPxH&_nc_oc=AdnqIkSPNUXKZgcnFEVvU_9BgsG8typ5XNCHmgNG0QEUtDNWV91xa3_jBjqWfOadZgY&_nc_zt=14&_nc_ht=scontent.fkwi3-2.fna&_nc_gid=4BIZ04PnOVnaujfYNhy9KQ&oh=00_AfEDO9AByiXwRyXSQPcNrtA14lYdgAUjjB8RDoa_4lyS8w&oe=67FB9D05"
                    }
                ],
                "videos": []
            }
        }
    ];

    // Load ads from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedAds = localStorage.getItem(`project_${id}_ads`);
            if (savedAds) {
                const parsedAds = JSON.parse(savedAds);
                setAds(parsedAds);
                if (parsedAds.length > 0) {
                    setPageName(parsedAds[0].page_name);
                }
            } else {
                setAds(mockAds);
            }
        }
    }, [id]);

    const filteredAds = useMemo(() => {
        if (activeTab === 'image') {
            return ads.filter(ad =>
                (ad.snapshot?.videos === null || ad.snapshot?.videos?.length === 0) &&
                ad.snapshot?.cards?.[0]?.resized_image_url
            );
        } else {
            return ads.filter(ad => ad.snapshot?.videos?.length > 0);
        }
    }, [ads, activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/facebook-ads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchTerm,
                    startDate,
                    endDate,
                    country,
                    language,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ads');
            }

            const data = await response.json();
            setAds(data.ads);
            localStorage.setItem(`project_${id}_ads`, JSON.stringify(data.ads));

            // Save workflow
            const workflowName = data.ads[0]?.page_name || `Workflow ${new Date().toLocaleDateString()}`;
            const workflow = {
                id: Date.now().toString(),
                name: workflowName,
                createdAt: new Date().toISOString(),
                ads: data.ads,
            };

            const savedWorkflows = localStorage.getItem('workflows');
            const workflows = savedWorkflows ? JSON.parse(savedWorkflows) : [];
            workflows.push(workflow);
            localStorage.setItem('workflows', JSON.stringify(workflows));

            setSuccess('Ads fetched successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                {pageName && (
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">{pageName}</h1>
                    </div>
                )}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('image')}
                            className={clsx(
                                activeTab === 'image'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                            )}
                        >
                            Image Ads ({ads.filter(ad => (ad.snapshot?.videos === null || ad.snapshot?.videos?.length === 0) && ad.snapshot?.cards?.[0]?.resized_image_url).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('video')}
                            className={clsx(
                                activeTab === 'video'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                            )}
                        >
                            Video Ads ({ads.filter(ad => ad.snapshot?.videos?.length > 0).length})
                        </button>
                    </nav>
                </div>

                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                    <AdTable ads={filteredAds} adType={activeTab} />
                </div>
            </div>
        </div>
    );
} 