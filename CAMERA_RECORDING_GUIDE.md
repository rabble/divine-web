# Camera Recording Implementation Guide

## Overview

The camera recording feature allows users to record videos directly from their device camera with support for pause/resume functionality, creating seamless cut effects. This feature uses the `@wmik/use-media-recorder` package which wraps the MediaRecorder API.

## Technology Stack

- **@wmik/use-media-recorder** (v1.6.5-beta.0): React hook for MediaRecorder API
- **MediaStream API**: Browser API for accessing camera/microphone
- **MediaRecorder API**: Browser API for recording media streams
- **WebM/VP9 codec**: Efficient video compression format

## Features

### 1. Square Viewfinder (1:1 Aspect Ratio)

The camera viewfinder is configured to capture square videos (1080x1080) optimized for social media:

```typescript
video: {
  width: { ideal: 1080 },
  height: { ideal: 1080 },
  aspectRatio: 1,
  facingMode: 'user'
}
```

**Benefits:**
- Consistent with social media formats (Instagram, TikTok)
- Optimized for mobile viewing
- Better composition for portrait-oriented content

### 2. Recording Controls

**Main Record Button:**
- Large red circular button (80x80px)
- States:
  - **Not recording**: Shows filled circle icon
  - **Recording**: Shows square icon with pulse animation
  - **Paused**: Shows play icon

**Stop Button:**
- Appears when recording or paused
- Outlined circular button (64x64px)
- Stops current segment recording

### 3. Multiple Segments (Cuts)

Users can create multiple recording segments:

1. Start recording → Pause → Resume → Stop
2. Each pause/resume cycle can create a new segment
3. Segments are stored in state as Blob objects
4. Users can delete individual segments before publishing

**Use Cases:**
- Remove mistakes or unwanted content
- Create jump cuts for pacing
- Combine multiple takes into one video

### 4. Visual Feedback

**Recording Indicator:**
```tsx
<div className="bg-red-600 text-white px-3 py-1.5 rounded-full">
  <Circle className="h-3 w-3 fill-current animate-pulse" />
  <span>Recording</span>
</div>
```

**Paused Indicator:**
```tsx
<div className="bg-yellow-600 text-white px-3 py-1.5 rounded-full">
  <Square className="h-3 w-3" />
  <span>Paused</span>
</div>
```

**Segment Counter:**
- Shows number of recorded segments
- Allows deletion of individual segments
- Visual badges for each segment

## Implementation Details

### useMediaRecorder Hook

```typescript
const {
  status: recordStatus,
  mediaBlob,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getMediaStream,
  liveStream,
  clearMediaStream,
  clearMediaBlob,
} = useMediaRecorder({
  mediaStreamConstraints: {
    audio: true,
    video: {
      width: { ideal: 1080 },
      height: { ideal: 1080 },
      aspectRatio: 1,
      facingMode: 'user'
    }
  },
  mediaRecorderOptions: {
    mimeType: 'video/webm;codecs=vp9',
  },
  onStop: (blob) => {
    setRecordedChunks(prev => [...prev, blob]);
  }
});
```

### Recording States

The `status` property from useMediaRecorder returns:
- `'idle'`: Not started
- `'acquiring_media'`: Requesting camera access
- `'ready'`: Camera ready, not recording
- `'recording'`: Currently recording
- `'paused'`: Recording paused
- `'stopping'`: Stopping recording
- `'stopped'`: Recording stopped
- `'failed'`: Error occurred

### Recording Flow

1. **Start Camera**:
   ```typescript
   await getMediaStream();
   // Requests camera/microphone access
   // Sets liveStream for preview
   ```

2. **Begin Recording**:
   ```typescript
   startRecording();
   // Starts MediaRecorder
   // Changes status to 'recording'
   ```

3. **Pause Recording**:
   ```typescript
   pauseRecording();
   // Pauses MediaRecorder
   // Changes status to 'paused'
   // Data remains in buffer
   ```

4. **Resume Recording**:
   ```typescript
   resumeRecording();
   // Resumes MediaRecorder
   // Changes status to 'recording'
   // Continues in same chunk
   ```

5. **Stop Recording**:
   ```typescript
   stopRecording();
   // Stops MediaRecorder
   // Triggers onStop callback with Blob
   // Resets to ready state
   ```

### Segment Management

```typescript
const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

// Add segment when recording stops
onStop: (blob) => {
  setRecordedChunks(prev => [...prev, blob]);
}

// Delete segment
const handleDeleteChunk = (index: number) => {
  setRecordedChunks(prev => prev.filter((_, i) => i !== index));
};

// Convert to upload segments
const segments = allChunks.map(blob => ({
  blob,
  blobUrl: URL.createObjectURL(blob)
}));
```

### Video Preview

The live camera feed is displayed using a video element:

```tsx
<video
  ref={(video) => {
    if (video && liveStream) {
      video.srcObject = liveStream;
    }
  }}
  autoPlay
  muted
  playsInline
  className="w-full h-full object-cover"
/>
```

**Key Properties:**
- `autoPlay`: Starts playback immediately
- `muted`: Prevents audio feedback loop
- `playsInline`: iOS compatibility for inline playback
- `object-cover`: Fills container while maintaining aspect ratio

## Browser Compatibility

### MediaRecorder API Support

| Browser | Support |
|---------|---------|
| Chrome 47+ | ✅ Full support |
| Firefox 25+ | ✅ Full support |
| Safari 14.1+ | ✅ Full support |
| Edge 79+ | ✅ Full support |
| Opera 36+ | ✅ Full support |

### WebM/VP9 Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ⚠️ Limited (may need fallback) |
| Edge | ✅ Full support |

**Fallback Options:**
```typescript
const supportedMimeTypes = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4'
];

const mimeType = supportedMimeTypes.find(type => 
  MediaRecorder.isTypeSupported(type)
);
```

## Permissions

### Required Permissions

1. **Camera**: `video: true`
2. **Microphone**: `audio: true`

### Permission Handling

```typescript
const handleStartCamera = async () => {
  try {
    await getMediaStream();
  } catch (error) {
    console.error('Failed to access camera:', error);
    toast({
      title: 'Camera Access Denied',
      description: 'Please allow camera access to record videos',
      variant: 'destructive',
    });
  }
};
```

### Common Permission Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `NotAllowedError` | User denied permission | Re-request or guide user to settings |
| `NotFoundError` | No camera/mic found | Inform user to connect device |
| `NotReadableError` | Device in use by another app | Close other apps using camera |
| `OverconstrainedError` | Constraints not met | Relax video constraints |

## Performance Considerations

### Memory Management

**Blob Cleanup:**
```typescript
// Always revoke blob URLs when done
recordedChunks.forEach(chunk => {
  const url = URL.createObjectURL(chunk);
  URL.revokeObjectURL(url);
});

// Cleanup on component unmount
useEffect(() => {
  return () => {
    clearMediaStream();
    clearMediaBlob();
  };
}, []);
```

### Video Quality vs File Size

Current settings balance quality and file size:

| Setting | Value | Impact |
|---------|-------|--------|
| Resolution | 1080x1080 | High quality, larger file |
| Codec | VP9 | 30-50% smaller than VP8 |
| Bitrate | Auto | Browser-optimized |

**Optimization Opportunities:**
- Add bitrate control for slower connections
- Offer quality presets (Low/Medium/High)
- Compress before upload

### Recording Duration Limits

While there's no hard limit, practical considerations:

- **Browser memory**: Long recordings consume RAM
- **File size**: Longer videos = larger uploads
- **User experience**: 6-second videos align with platform

**Recommendation**: Limit to 6 seconds for Vine-style content.

## Error Handling

### Common Errors

1. **Camera Access Denied**
   ```typescript
   catch (error) {
     if (error.name === 'NotAllowedError') {
       // User denied camera access
     }
   }
   ```

2. **No Camera Available**
   ```typescript
   catch (error) {
     if (error.name === 'NotFoundError') {
       // No camera device found
     }
   }
   ```

3. **Recording Failed**
   ```typescript
   onError: (error) => {
     console.error('Recording error:', error);
     toast({
       title: 'Recording Failed',
       description: error.message,
       variant: 'destructive'
     });
   }
   ```

## User Experience Best Practices

### 1. Clear Instructions
- Show status indicators (Recording/Paused)
- Provide button labels and tooltips
- Guide users through first-time flow

### 2. Visual Feedback
- Animate recording button
- Show recording duration
- Display segment counter

### 3. Error Recovery
- Graceful error handling
- Clear error messages
- Option to retry or switch to file upload

### 4. Performance
- Cleanup resources on unmount
- Revoke blob URLs when done
- Clear camera stream when not needed

## Testing Checklist

- [ ] Camera access request works
- [ ] Microphone access request works
- [ ] Video preview displays correctly
- [ ] Record button starts recording
- [ ] Pause button pauses recording
- [ ] Resume continues recording
- [ ] Stop creates new segment
- [ ] Multiple segments can be recorded
- [ ] Segments can be deleted
- [ ] Segments merge correctly
- [ ] Recording works on mobile
- [ ] Recording works on desktop
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Cleanup prevents memory leaks
- [ ] Error messages are helpful
- [ ] UI is responsive

## Future Enhancements

### 1. Segment Merging with FFmpeg.wasm
Currently, segments are uploaded separately. Future: merge client-side.

```typescript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const mergeSegments = async (segments: Blob[]): Promise<Blob> => {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();
  
  // Write segments to FFmpeg virtual filesystem
  for (let i = 0; i < segments.length; i++) {
    ffmpeg.FS('writeFile', `segment${i}.webm`, 
      await fetchFile(segments[i]));
  }
  
  // Create concat file
  const concat = segments.map((_, i) => 
    `file 'segment${i}.webm'`
  ).join('\n');
  ffmpeg.FS('writeFile', 'concat.txt', concat);
  
  // Merge segments
  await ffmpeg.run('-f', 'concat', '-safe', '0', 
    '-i', 'concat.txt', '-c', 'copy', 'output.webm');
  
  // Read output
  const data = ffmpeg.FS('readFile', 'output.webm');
  return new Blob([data.buffer], { type: 'video/webm' });
};
```

### 2. Camera Switching
Allow switching between front and rear cameras on mobile:

```typescript
const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

const switchCamera = () => {
  setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  // Re-request media stream with new facing mode
};
```

### 3. Audio Level Meter
Visual feedback for audio input:

```typescript
const [audioLevel, setAudioLevel] = useState(0);

useEffect(() => {
  if (!liveStream) return;
  
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(liveStream);
  microphone.connect(analyser);
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  const updateLevel = () => {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255);
    requestAnimationFrame(updateLevel);
  };
  
  updateLevel();
  
  return () => {
    microphone.disconnect();
    audioContext.close();
  };
}, [liveStream]);
```

### 4. Countdown Timer
3-2-1 countdown before recording starts:

```typescript
const [countdown, setCountdown] = useState<number | null>(null);

const startWithCountdown = async () => {
  for (let i = 3; i > 0; i--) {
    setCountdown(i);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  setCountdown(null);
  startRecording();
};
```

## Related Files

- `src/pages/PostPage.tsx` - Main implementation
- `package.json` - @wmik/use-media-recorder dependency
- `POST_FEATURE_SUMMARY.md` - Feature overview
- `FEATURE_BRANCH_SUMMARY.md` - Branch summary

## Resources

- [MediaRecorder API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MediaStream API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
- [@wmik/use-media-recorder (GitHub)](https://github.com/wmik/use-media-recorder)
- [WebM Container Format](https://www.webmproject.org/)
- [VP9 Video Codec](https://www.webmproject.org/vp9/)
