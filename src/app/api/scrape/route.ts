import { NextResponse } from 'next/server';

const mockAds = [
    {
        "ad_archive_id": "486517397763120",
        "ad_id": null,
        "archive_types": [],
        "categories": [
            "UNKNOWN"
        ],
        "collation_count": null,
        "collation_id": null,
        "contains_digital_created_media": false,
        "contains_sensitive_content": false,
        "currency": "",
        "end_date": 1744009200,
        "entity_type": "PERSON_PROFILE",
        "fev_info": null,
        "gated_type": "ELIGIBLE",
        "has_user_reported": false,
        "hidden_safety_data": false,
        "hide_data_status": "NONE",
        "impressions_with_index": {
            "impressions_text": null,
            "impressions_index": -1
        },
        "is_aaa_eligible": false,
        "is_active": true,
        "is_profile_page": false,
        "menu_items": [],
        "page_id": "337470849796957",
        "page_is_deleted": false,
        "page_name": "Vibriance",
        "political_countries": [],
        "publisher_platform": [
            "FACEBOOK",
            "INSTAGRAM",
            "AUDIENCE_NETWORK",
            "MESSENGER"
        ],
        "reach_estimate": null,
        "regional_regulation_data": {
            "finserv": {
                "is_deemed_finserv": false,
                "is_limited_delivery": false
            },
            "tw_anti_scam": {
                "is_limited_delivery": false
            }
        },
        "report_count": null,
        "snapshot": {
            "body": {
                "text": "{{product.brand}}"
            },
            "branded_content": null,
            "brazil_tax_id": null,
            "byline": null,
            "caption": "secure.vibriance.com",
            "cards": [
                {
                    "body": "\"The first time I used it I noticed my eye bags looked a lot smaller. Shortly after I saw my dark circles were lighter, I'm shocked how well this worked!\"\n\nCathy O. - Eye Renewal Serum Customer\n\nExclusively made for your 50's, 60's, 70's and beyond…\n\nVibriance Eye Renewal Serum rejuvenates skin under eyes for a well-rested appearance.\n\nThis multi-tasking eye serum replaces 3 products. It's your tightening, brightening, and wrinkle-reducing treatment all-in-one.\n\nIt can reduce the appearance of under-eye bags the very first time you use it!\n\nExperience the Vibriance difference today:\n\nhttps://secure.vibriance.com/",
                    "caption": "",
                    "cta_text": "Shop Now",
                    "cta_type": "SHOP_NOW",
                    "image_crops": [],
                    "link_description": null,
                    "link_url": "https://secure.vibriance.com/?_ef_transaction_id=&affId=17574279&c1=[c1]&c2=[c2]&c3=&subid=[subid]&click_id=[click_id]&affidef=1&oid=12&sub1=fb-10-05-24&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_medium=cpc&utm_source=facebook&utm_term={{adset.name}}",
                    "original_image_url": "https://scontent-ord5-2.xx.fbcdn.net/v/t39.35426-6/462003782_2333265180358060_5891613254892052161_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=4EIWIOt0ig4Q7kNvwHurslS&_nc_oc=AdkiYsT0EDn8Cjq4BJ_ny3OIU2yaDHitjrKviP6cgsRbrA5f1x6NT8LDjrVtYQ6nuYM&_nc_zt=14&_nc_ht=scontent-ord5-2.xx&_nc_gid=8o5rHqShNsMtRgBkr7QuFA&oh=00_AfGGpmljuvoI6cwlq_8dhpexgadB0dXBHSRfKgzSBswHDA&oe=67F9EDC6",
                    "resized_image_url": "https://scontent-ord5-2.xx.fbcdn.net/v/t39.35426-6/462046481_2239039966461422_6503903250882923093_n.jpg?stp=dst-jpg_s600x600_tt6&_nc_cat=104&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=dst82LC5j30Q7kNvwGOGWAJ&_nc_oc=AdnpCeGZ20NAcjPJ2gOJ0QlYXoPg9ot7ulB4hFVmEWKgdxNC3j9yuXB_WFQJ1PgaaVc&_nc_zt=14&_nc_ht=scontent-ord5-2.xx&_nc_gid=8o5rHqShNsMtRgBkr7QuFA&oh=00_AfHm_uumhq6s5nAbyo5RkDU7o__oUKdQmyAZwM1yv3lMzg&oe=67FA1345",
                    "watermarked_resized_image_url": "",
                    "title": "Get \"Wide-Awake\" Eyes In Just One Use!",
                    "video_hd_url": null,
                    "video_preview_image_url": null,
                    "video_sd_url": null,
                    "watermarked_video_hd_url": null,
                    "watermarked_video_sd_url": null
                }
            ],
            "cta_text": "Shop now",
            "cta_type": "SHOP_NOW",
            "country_iso_code": null,
            "current_page_name": "Vibriance",
            "disclaimer_label": null,
            "display_format": "DCO",
            "event": null,
            "images": [],
            "is_reshared": false,
            "link_description": "{{product.description}}",
            "link_url": "https://secure.vibriance.com/?_ef_transaction_id=&affId=17574279&c1=[c1]&c2=[c2]&c3=&subid=[subid]&click_id=[click_id]&affidef=1&oid=12&sub1=fb-10-05-24&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_medium=cpc&utm_source=facebook&utm_term={{adset.name}}",
            "page_categories": [
                "Health & Beauty"
            ],
            "page_entity_type": "PERSON_PROFILE",
            "page_id": "337470849796957",
            "page_is_deleted": false,
            "page_is_profile_page": false,
            "page_like_count": 14981,
            "page_name": "Vibriance",
            "page_profile_picture_url": "https://scontent-ord5-3.xx.fbcdn.net/v/t39.35426-6/462229430_1246290703077992_5857364766278576687_n.jpg?stp=dst-jpg_s60x60_tt6&_nc_cat=110&ccb=1-7&_nc_sid=c53f8f&_nc_ohc=5W3Ta9mNu6sQ7kNvwHRBKQC&_nc_oc=AdmFxhLByZVAaPFjmYegcmIDia3tN8rP2wBcep0cGkJNYFuyms2aa6FFvm-oXMl-F-k&_nc_zt=14&_nc_ht=scontent-ord5-3.xx&_nc_gid=8o5rHqShNsMtRgBkr7QuFA&oh=00_AfEDgCag6PB70fut9DOlkMC59q0x5sCL9TMgBonDueV60w&oe=67F9F50E",
            "page_profile_uri": "https://www.facebook.com/Vibriance/",
            "root_reshared_post": null,
            "title": "{{product.name}}",
            "videos": [],
            "additional_info": null,
            "ec_certificates": [],
            "extra_images": [],
            "extra_links": [],
            "extra_texts": [],
            "extra_videos": []
        },
        "spend": null,
        "start_date": 1744009200,
        "state_media_run_label": null,
        "targeted_or_reached_countries": [],
        "total_active_time": 57623,
        "url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=vibriance&search_type=keyword_unordered",
        "total": 360
    }
];

export async function POST(request: Request) {
    try {
        // In development, return mock data
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({
                success: true,
                data: mockAds
            });
        }

        // In production, make the actual API call
        const body = await request.json();
        const response = await fetch('https://api.apify.com/v2/acts/your-actor/runs/last/dataset/items?token=your-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data from Apify');
        }

        const data = await response.json();
        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An error occurred'
        }, { status: 500 });
    }
} 