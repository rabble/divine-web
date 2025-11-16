# Post Creation Feature

## Overview
This feature adds the ability for logged-in users to create and publish video posts to the Nostr network. Posts are created using the same event structure as the Discovery feed (Kind 22 - NIP-71 short-form videos).

## Implementation Details

### New Files
- **`src/pages/PostPage.tsx`**: Main post creation page with file upload and metadata form

### Modified Files
- **`src/components/BottomNav.tsx`**: Added "Post" navigation button with Plus icon
- **`src/AppRouter.tsx`**: Added `/post` route (login required)

## Features

### 1. File Upload
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
- **Event Kind**: 22 (SHORT_VIDEO_KIND) - same as Discovery feed
- **Progress Tracking**: Visual progress bar for upload and publish
- **Error Handling**: User-friendly error messages with toast notifications

### 4. Event Structure
Posts create Nostr events with the following structure:
```typescript
{
  kind: 22,
  content: description,
  tags: [
    ['d', vineId],                    // Addressable identifier
    ['title', title],                 // Video title
    ['published_at', timestamp],      // Publication timestamp
    ['imeta', ...videoMetadata],      // Video file metadata
    ['duration', seconds],            // Video duration
    ['t', hashtag1],                  // Hashtag 1
    ['t', hashtag2],                  // Hashtag 2
    ['alt', description],             // Alt text for accessibility
    ['client', 'divine-web']          // Client attribution
  ]
}
```

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

1. **Navigate to Post page**:
   - Click "Post" button in bottom navigation (mobile)
   - Navigate to `/post` route (desktop)

2. **Select video file**:
   - Click "Select Video File" button
   - Choose MP4, WebM, or GIF file (max 50MB)

3. **Add metadata**:
   - Enter title (required)
   - Add description (optional)
   - Add hashtags (optional)

4. **Publish**:
   - Click "Publish" button
   - Wait for upload and publishing to complete
   - Automatically redirected to home feed

## Future Enhancements
- Multiple segment support (currently uses first segment only)
- Video trimming and editing
- Thumbnail selection
- Draft saving
- Post scheduling
- Video filters and effects
- Direct recording (camera/screen capture)
- Batch upload support
