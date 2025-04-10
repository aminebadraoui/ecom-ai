import { NextResponse } from 'next/server';

// Sample concept data examples
const conceptExamples = [
    {
        "layout": {
            "canvas": {
                "background": {
                    "type": "solid",
                    "color": "white",
                    "effect": "clean, neutral backdrop that enhances contrast and keeps visual focus on content"
                },
                "tone": "bold, energetic, and conversion-driven",
                "vibe": "high-impact, transformational, immediate-results focused"
            },
            "visual_hierarchy": {
                "flow": [
                    "logo_signature",
                    "headline_block",
                    "before_after_comparison",
                    "product_visual"
                ],
                "primary_attention": "headline_block",
                "secondary_attention": "before_after_comparison",
                "tertiary_attention": "product_visual",
                "supporting_attention": "brand signature"
            }
        },
        "components": [
            {
                "type": "logo_signature",
                "position": {
                    "alignment": "top-center",
                    "margin_top": "small"
                },
                "styling": {
                    "size": "small",
                    "opacity": "medium",
                    "text_color": "neutral gray"
                },
                "purpose": "establishes brand recognition without competing for attention",
                "best_practices": [
                    "Place branding subtly to maintain brand presence while keeping user attention on benefits"
                ]
            },
            {
                "type": "headline_block",
                "position": {
                    "alignment": "top-left",
                    "margin_top": "medium",
                    "margin_left": "medium",
                    "width": "50%"
                },
                "content": [
                    {
                        "text": "GIVE YOURSELF A",
                        "font_size": "medium",
                        "font_weight": "bold",
                        "text_color": "black",
                        "case": "uppercase"
                    },
                    {
                        "text": "60",
                        "font_size": "extra-large",
                        "font_weight": "bold",
                        "text_color": "bright pink",
                        "case": "number emphasis"
                    },
                    {
                        "text": "SECOND MAKEOVER",
                        "font_size": "medium",
                        "font_weight": "bold",
                        "text_color": "pink"
                    },
                    {
                        "text": "...With Just One Stick!",
                        "font_size": "large",
                        "font_weight": "bold",
                        "text_color": ["brown", "black"],
                        "case": "title"
                    }
                ],
                "purpose": "communicates the transformation, timeframe, and simplicity of use",
                "best_practices": [
                    "Use large, colorful typography for urgency and impact",
                    "Contrast font sizes and weights to guide eye movement",
                    "Focus on measurable outcomes (e.g., time, ease, simplicity)"
                ]
            },
            {
                "type": "before_after_comparison",
                "position": {
                    "alignment": "top-right",
                    "margin_right": "medium",
                    "width": "50%"
                },
                "content": [
                    {
                        "type": "image",
                        "label": "BEFORE",
                        "position": "top",
                        "styling": {
                            "border_radius": "medium",
                            "border_color": "bright pink",
                            "label_background": "bright pink",
                            "label_text_color": "white",
                            "label_font_size": "small"
                        }
                    },
                    {
                        "type": "image",
                        "label": "AFTER",
                        "position": "bottom",
                        "styling": {
                            "border_radius": "medium",
                            "border_color": "bright pink",
                            "label_background": "bright pink",
                            "label_text_color": "white",
                            "label_font_size": "small"
                        }
                    }
                ],
                "purpose": "provides visual proof of transformation, increasing credibility and emotional connection",
                "best_practices": [
                    "Ensure lighting, angles, and facial expressions remain consistent",
                    "Use clear 'Before' and 'After' tags for immediate clarity",
                    "Leverage authentic expressions to build trust"
                ]
            }
        ],
        "design_purpose": {
            "marketing_goals": [
                "Create urgency through time-bound promises (e.g., '60 seconds')",
                "Use before/after proof to build instant trust and demonstrate effectiveness",
                "Highlight simplicity of use with minimal copy",
                "Appeal to user aspirations of transformation, convenience, and confidence"
            ],
            "ux_goals": [
                "Ensure fast visual scanning: bold number, proof, product",
                "Keep elements separated yet visually connected via alignment",
                "Support mobile-first readability with vertical stacking potential",
                "Use bright accent colors to direct attention without clutter"
            ],
            "adaptability": "This layout works well for skincare, cleaning products, fitness tools, haircare, pet grooming solutions, or even digital apps with a 'before-after' effect. Swap in appropriate images, time/value proposition, and product format."
        }
    },
    {
        "template_name": "Testimonial Product Highlight with Text Overlay",
        "visual_tone": "friendly, approachable, trustworthy, uplifting",
        "layout": {
            "background": {
                "type": "interior room background",
                "color_tone": "neutral",
                "lighting": "soft, natural daylight",
                "purpose": "adds authenticity and relatability while not distracting from the subject"
            },
            "primary_subject_area": {
                "type": "testimonial photo",
                "position": "center-right weighted",
                "size": "large (occupies ~60-70% width of image)",
                "subject_expression": "smiling, confident, natural",
                "purpose": "establishes trust and emotional connection",
                "styling_notes": {
                    "hair_makeup": "polished but natural",
                    "wardrobe": "light, clean, pastel color shirt enhancing warmth and relatability",
                    "pose": "subject holding product near eye, directly engaging with camera"
                }
            },
            "product_placement": {
                "type": "physical product in hand",
                "position": "lower center-right, partially overlapping face",
                "angle": "slightly tilted upward, logo facing forward",
                "highlight": {
                    "type": "line and arrow annotation",
                    "color": "white",
                    "target": "under-eye area",
                    "purpose": "guides viewer's attention to area of transformation"
                }
            }
        },
        "visual_hierarchy": {
            "primary_focus": "subject's face and eyes (emotional connection)",
            "secondary_focus": "product in hand (reinforces brand + function)",
            "tertiary_focus": "text block with benefit and social proof",
            "flow": "starts from face > eye area with product > bottom text"
        },
        "design_purpose": {
            "goals": [
                "instantly communicate emotional and functional benefit",
                "build trust through real-person imagery",
                "emphasize ease-of-use or non-invasive nature of product",
                "reinforce brand subtly but clearly",
                "drive curiosity and confidence in effectiveness"
            ],
            "best_practices": [
                "use of a relatable, happy model to build authenticity",
                "text overlay with a clear benefit and a curiosity hook",
                "annotation/arrow to visually reinforce transformation area",
                "color contrast between text and background for readability",
                "balanced layout with a human element leading the narrative"
            ]
        }
    }
];

export async function GET(request: Request) {
    // Get the example index from query params (default to first example)
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index') || '0', 10);

    // If index is valid, return that example, otherwise return all examples
    if (index >= 0 && index < conceptExamples.length) {
        return NextResponse.json({
            concept: {
                id: `example-${index}`,
                ad_archive_id: '123456789',
                page_name: index === 0 ? 'Vibrance' : 'Eye Renewal Serum',
                concept_json: conceptExamples[index],
                created_at: new Date().toISOString()
            }
        });
    }

    // Return all examples
    return NextResponse.json({
        concepts: conceptExamples.map((example, i) => ({
            id: `example-${i}`,
            ad_archive_id: `12345678${i}`,
            page_name: i === 0 ? 'Vibrance' : 'Eye Renewal Serum',
            concept_json: example,
            created_at: new Date().toISOString()
        }))
    });
} 