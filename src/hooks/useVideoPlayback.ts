// ABOUTME: Hook for accessing the video playback context
// ABOUTME: Manages which video is currently playing in the feed

import { useContext } from 'react';
import { VideoPlaybackContext } from '@/contexts/VideoPlaybackContext';

export function useVideoPlayback() {
  const context = useContext(VideoPlaybackContext);
  if (context === undefined) {
    throw new Error('useVideoPlayback must be used within a VideoPlaybackProvider');
  }
  return context;
}