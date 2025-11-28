# Post Creation Feature

## Overview
This feature adds the ability for logged-in users to create and publish video posts to the Nostr network. Posts are created using the same event structure as the Discovery feed (Kind 34236 - NIP-71 addressable short-form videos).

## Implementation Details

### New Files
- **`src/pages/PostPage.tsx`**: Main post creation page with file upload and metadata form

### Modified Files
- **`src/components/BottomNav.tsx`**: Added "Post" navigation button with Plus icon
- **`src/AppRouter.tsx`**: Added `/post` route (login required)

## Features

### 1. Video Recording & Upload

**Camera Recording:**
- **Square viewfinder**: 1:1 aspect ratio (1080x1080)
- **Record button**: Red circular button with pause/resume
- **Multiple segments**: Support for cuts (stop and resume recording)
- **Status indicators**: Visual feedback for Recording/Paused states
- **Segment management**: View and delete individual segments
- **Quality**: 1080x1080 resolution with WebM/VP9 codec

**File Upload:**
- **Supported formats**: MP4, WebM, GIF
- **File size limit**: 50MB maximum
- **File picker**: Native file input with validation
- **Preview**: Live video preview with playback controls

### 2. Metadata Form
- **Title** (required): Up to 100 characters
- **Description** (optional): Up to 500 characters
- **Hashtags**: Add multiple hashtags with autocomplete
  - Enter hashtag and press Enter, Space, or Comma to add
  - Remove hashtags with X button
  - Automatically removes # prefix if provided

### 3. Upload & Publishing
- **Blossom Server**: `https://blossom.divine.video/`
- **Event Kind**: 34236 (ADDRESSABLE_SHORT_VIDEO_KIND) - Addressable short videos per NIP-71 PR #2072
- **Progress Tracking**: Visual progress bar for upload and publish
- **Error Handling**: User-friendly error messages with toast notifications

### 4. Event Structure (NIP-71 PR #2072)
Posts create addressable Nostr events with the following structure:
```typescript
{
  kind: 34236, // Addressable short video event
  content: description,
  tags: [
    ['d', vineId],                    // Required: Unique identifier for addressable events
    ['title', title],                 // Required: Video title
    ['published_at', timestamp],      // Required: Publication timestamp
    ['imeta', ...videoMetadata],      // Required: Video file metadata (url, mime type, dimensions, etc.)
    ['duration', seconds],            // Video duration
    ['t', hashtag1],                  // Hashtag 1
    ['t', hashtag2],                  // Hashtag 2
    ['alt', description],             // Alt text for accessibility
    ['client', 'divine-web']          // Client attribution
  ]
}
```

**Addressable Event Benefits:**
- Events can be updated while maintaining the same reference
- Metadata corrections without republishing entire video
- URL migration when hosting changes
- Preservation of original content IDs from legacy platforms

### 5. Navigation
- **Bottom Nav**: New "Post" button with Plus icon (mobile only)
- **Desktop**: Route accessible at `/post`
- **Login Required**: Redirects to home if not logged in

### 6. User Experience
- **Mobile-first design**: Optimized for mobile devices
- **Responsive layout**: Desktop view with side-by-side preview and form
- **Video preview**: Live playback with loop and controls
- **Character counters**: Real-time character count for title and description
- **Hashtag badges**: Visual display of added hashtags
- **Cancel option**: Cleanup and navigation on cancel
- **Success feedback**: Toast notification and redirect on successful publish

## Technical Details

### Dependencies
- Uses existing hooks:
  - `useVideoUpload`: Handles video file upload to Blossom
  - `usePublishVideo`: Creates and publishes Nostr events
  - `useCurrentUser`: Manages user authentication
  - `useToast`: Provides user feedback

### Validation
- File type validation (MP4, WebM, GIF only)
- File size validation (max 50MB)
- Title required validation
- Form state management

### Cleanup
- Automatic blob URL cleanup on publish or cancel
- Proper memory management for video previews

## Usage

### Option 1: Record with Camera

1. **Navigate to Post page**:
   - Click "Post" button in bottom navigation (mobile)
   - Navigate to `/post` route (desktop)

2. **Choose "Record with Camera"**:
   - Click "Record with Camera" button
   - Allow camera and microphone access

3. **Record video**:
   - Click "Start Camera" to activate camera
   - Click red record button to start recording
   - Click record button again to pause (create a cut)
   - Click play button to resume recording
   - Click stop button (square) to finish current segment
   - Delete unwanted segments if needed
   - Click "Next" when done recording

4. **Add metadata**:
   - Enter title (required)
   - Add description (optional)
   - Add hashtags (optional)

5. **Publish**:
   - Click "Publish" button
   - Wait for upload and publishing to complete
   - Automatically redirected to home feed

### Option 2: Upload Video File

1. **Navigate to Post page**:
   - Click "Post" button in bottom navigation (mobile)
   - Navigate to `/post` route (desktop)

2. **Choose "Upload Video File"**:
   - Click "Upload Video File" button
   - Select MP4, WebM, or GIF file (max 50MB)

3. **Add metadata**:
   - Enter title (required)
   - Add description (optional)
   - Add hashtags (optional)

4. **Publish**:
   - Click "Publish" button
   - Wait for upload and publishing to complete
   - Automatically redirected to home feed

## Future Enhancements
- ✅ ~~Multiple segment support~~ (Implemented!)
- ✅ ~~Direct camera recording~~ (Implemented!)
- Automatic segment merging with FFmpeg.wasm
- Video trimming and editing
- Thumbnail selection
- Draft saving
- Post scheduling
- Video filters and effects
- Front/rear camera switching
- Screen recording
- Batch upload support
- Audio level meter
- Countdown timer before recording
