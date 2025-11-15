# Web Video Upload System

## Overview

The Divine web app now supports video recording and uploading directly from your browser, providing a Vine-style 6-second video creation experience comparable to the mobile app.

## Features

### 🎥 Camera Recording
- **Press-to-Record**: Hold the record button to capture video, release to pause
- **Segmented Recording**: Record multiple clips that combine into one video
- **6-Second Limit**: Automatic stop at maximum duration
- **Camera Switching**: Toggle between front and back cameras (where supported)
- **Real-time Progress**: Visual progress bar showing recording time
- **Live Preview**: See what you're recording in real-time

### ✍️ Metadata & Publishing
- **Title & Description**: Add context to your videos
- **Hashtags**: Tag your content for discovery
- **Video Preview**: Review your video before publishing
- **Upload Progress**: Real-time upload and publishing progress indicators
- **Blossom Integration**: Videos uploaded to decentralized Blossom servers

### 🔒 Security
- **Login Required**: Only authenticated users can upload
- **Browser Permissions**: Requires camera and microphone access
- **Clean Uploads**: Temporary blob URLs are cleaned up after upload

## How to Use

### 1. Access Upload Page
- Login to your Divine account
- Click the **Upload** button in the header
- Or navigate to `/upload`

### 2. Choose Recording Method
- **Record with Camera**: Use your device's camera (available now)
- **Upload Video**: Upload a pre-recorded file (coming soon)

### 3. Record Your Video
1. **Allow Permissions**: Grant camera and microphone access when prompted
2. **Position Camera**: Preview appears immediately
3. **Record Segments**:
   - Press and **hold** the red button to record
   - **Release** to pause
   - **Press again** to continue recording
   - Watch the progress bar to track time (max 6 seconds)
4. **Review**: See your recorded segments listed on screen
5. **Start Over**: Use "Start Over" button to discard and re-record
6. **Continue**: Tap the checkmark when satisfied

### 4. Add Metadata
1. **Title** (required): Give your vine a catchy title
2. **Description** (optional): Add more context
3. **Hashtags** (optional): 
   - Type a tag and press Enter, Space, or comma
   - Click X on a tag to remove it
   - Multiple hashtags supported

### 5. Publish
1. Click **Publish Vine**
2. Wait for upload progress (video uploads to Blossom)
3. Wait for publishing progress (event published to Nostr relays)
4. Automatic redirect to home feed to see your new video

## Technical Implementation

### Architecture

```
src/
├── hooks/
│   ├── useMediaRecorder.ts      # Camera recording logic
│   ├── useVideoUpload.ts         # Video upload & segment combining
│   └── usePublishVideo.ts        # Nostr event publishing (updated)
├── components/
│   ├── CameraRecorder.tsx        # Camera UI with controls
│   ├── VideoMetadataForm.tsx     # Metadata entry & preview
│   └── ui/progress.tsx           # Progress bar component
└── pages/
    └── UploadPage.tsx            # Main upload flow orchestration
```

### Key Technologies

- **MediaRecorder API**: Browser-native video recording
- **getUserMedia**: Camera access
- **Blob URLs**: Temporary video preview
- **Blossom**: Decentralized video hosting
- **Nostr NIP-71**: Video event publishing (kind 34236)

### Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari  | ✅ | ✅ |
| Edge    | ✅ | ❌ (untested) |

**Requirements:**
- Modern browser with MediaRecorder API support
- HTTPS connection (required for camera access)
- Camera and microphone hardware

### Supported Video Formats

The system automatically detects the best supported format:
1. `video/webm;codecs=vp9` (preferred)
2. `video/webm;codecs=vp8`
3. `video/webm`
4. `video/mp4` (fallback)

## Limitations & Future Enhancements

### Current Limitations

1. **Multi-Segment Merging**: Multiple recording segments are not yet combined
   - Currently uses only the first segment
   - Full FFmpeg.wasm integration planned

2. **File Upload**: Direct video file upload not yet implemented
   - Coming soon for uploading pre-recorded videos

3. **Advanced Controls**: 
   - No zoom, focus, or exposure controls yet
   - Basic camera switching only

### Planned Features

- ✨ FFmpeg.wasm integration for proper segment merging
- 📁 Direct video file upload
- 🎨 Video filters and effects
- 🔍 Advanced camera controls (zoom, focus)
- 💾 Save drafts locally
- 🎬 Video trimming and editing
- 📊 Upload analytics

## Troubleshooting

### Camera Access Denied
**Problem**: Browser blocks camera access

**Solutions**:
1. Click the camera icon in browser address bar
2. Grant camera and microphone permissions
3. Refresh the page
4. Check browser settings for site permissions

### Video Not Recording
**Problem**: Record button doesn't work

**Solutions**:
1. Ensure you're on HTTPS (required for getUserMedia)
2. Check browser console for errors
3. Try a different browser
4. Verify camera is not in use by another app

### Upload Fails
**Problem**: Video doesn't upload to Blossom

**Solutions**:
1. Check internet connection
2. Verify you're logged in
3. Try recording a shorter video
4. Check browser console for network errors
5. Contact support if persistent

### Publishing Fails
**Problem**: Upload succeeds but Nostr publish fails

**Solutions**:
1. Verify your Nostr signer is connected
2. Check relay connections
3. Try again - may be temporary relay issue
4. Check browser console for event signing errors

## Privacy & Data

- **Local Recording**: Video is recorded locally in your browser
- **No Server Storage**: We don't store your recordings
- **Blossom Upload**: Videos uploaded to Blossom servers you select
- **Nostr Publishing**: Video URL and metadata published to Nostr relays
- **Temporary URLs**: Blob URLs cleaned up after upload
- **Public Content**: All published videos are public on Nostr

## Comparison to Mobile App

| Feature | Web | Mobile App |
|---------|-----|------------|
| Camera Recording | ✅ | ✅ |
| Segmented Recording | ✅ | ✅ |
| Multi-segment Merging | ⚠️ Partial | ✅ Full |
| File Upload | ❌ Coming | ✅ |
| ProofMode | ❌ | ✅ |
| Drafts | ❌ | ✅ |
| Video Editing | ❌ | ⚠️ Limited |

The web app provides core recording functionality with plans to reach feature parity with mobile.

## Contributing

Found a bug or want to add features? 

1. Check the issue tracker on GitHub
2. Submit bug reports with browser info
3. PRs welcome for enhancements
4. Test on multiple browsers

## Support

Need help?
- 📖 Read the [FAQ](/faq)
- 💬 Join the community discussions
- 📧 Contact support at [support page](/support)
- 🐛 Report bugs on GitHub

---

**Made with ❤️ for the Divine community**

*Last updated: November 14, 2025*
