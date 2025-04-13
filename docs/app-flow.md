# E-commerce AI Ad Generation Flow

## Overview
The application helps users analyze Facebook ads and generate new ad concepts and creatives using AI. Here's a detailed breakdown of the flow:

## Components and Data Structure

### Ad Data Structure
```typescript
interface Ad {
    ad_archive_id: string;
    start_date: number;
    url: string;
    page_name: string;
    snapshot: {
        body: { text: string | null };
        cards: Array<{ body: string | null; resized_image_url: string | null }>;
        videos: Array<{ video_preview_image_url: string | null; video_hd_url: string | null }>;
        images: Array<{ resized_image_url: string | null }>;
    };
    concept?: {
        id: string | null;
        task_id: string | null;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        concept_json?: any;
        error?: string;
    };
    ad_recipe?: {
        id: string;
        status: 'pending' | 'completed' | 'failed';
    };
}
```

## Application Flow

### 1. Project View (`/projects/[id]/page.tsx`)
- Users can view a collection of ads within a project
- Ads are fetched from the database along with their associated concepts
- The page displays two tables: one for image ads and one for video ads

### 2. Ad Display (`AdTable` Component)
- Displays ads in a table format with columns for:
  - Media preview (image/video thumbnail)
  - Body text
  - Start date
  - Ad Library link
  - Concept status/actions
  - Ad generation status/actions
- Supports selectable rows for bulk operations
- Handles different media types (images and videos)

### 3. Concept Generation Flow
1. **Initiating Generation**
   - User clicks "Generate Concept" button for an ad
   - Component extracts media URL from ad data
   - Calls `onGenerateConcept(ad, mediaUrl)`

2. **API Request** (`/api/ad-concepts/route.ts`)
   - Sends POST request to create new concept
   - Includes `ad_archive_id` and `image_url`
   - Uses JWT authentication via cookies

3. **Processing States**
   - Shows loading spinner during generation
   - Updates concept status in real-time
   - Handles success/failure states

### 4. Concept Viewing
- Once completed, shows "View Concept" link
- Links to `/concepts/[id]` page
- Displays generated concept details

### 5. Ad Generation Flow
1. **Initiating Ad Generation**
   - Only enabled when concept is completed
   - User clicks "Generate Ad" button
   - Calls `onGenerateAd(adId, conceptId)`

2. **Processing**
   - Shows loading state during generation
   - Updates ad recipe status in real-time

3. **Completion**
   - Shows "View Ad" link when complete
   - Links to `/ad-recipes/[id]` page

### 6. Real-time Updates
- Uses Server-Sent Events (SSE) for status updates
- Endpoint: `/api/ad-concepts/[id]/stream`
- Updates concept status and data in real-time

## Authentication
- Uses custom JWT authentication
- Token stored in HTTP-only cookies
- Required for all API endpoints
- Validated on both client and server side

## External API Integration
- Connects to external AI service for generation
- URL configured via environment variables:
  - Development: `.env.local`
  - Production: `.env.production`
- Handles both development and production environments

## Error Handling
1. **Concept Generation**
   - Shows "Retry Generation" button on failure
   - Displays error messages when available
   - Logs detailed information for debugging

2. **Ad Generation**
   - Disables generation if concept isn't ready
   - Shows helpful tooltips explaining button states
   - Gracefully handles failures

## State Management
- Uses React state for local UI state
- Maintains lists of in-progress concepts and ads
- Updates UI based on generation status
- Handles selection state for bulk operations

This flow creates a seamless experience for users to:
1. View existing ads
2. Generate AI concepts from those ads
3. Monitor generation progress in real-time
4. Generate new ads based on approved concepts
5. Access all generated content through a unified interface 