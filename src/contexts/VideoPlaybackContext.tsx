// ABOUTME: Context for managing video playback state across the feed
// ABOUTME: Ensures only one video plays at a time based on viewport visibility

import { createContext, useState, useRef, ReactNode } from 'react';

export interface VideoPlaybackContextType {
  activeVideoId: string | null;
  setActiveVideo: (videoId: string | null) => void;
  registerVideo: (videoId: string, element: HTMLVideoElement) => void;
  unregisterVideo: (videoId: string) => void;
  globalMuted: boolean;
  setGlobalMuted: (muted: boolean) => void;
}

export const VideoPlaybackContext = createContext<VideoPlaybackContextType | undefined>(undefined);

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [globalMuted, setGlobalMuted] = useState(true); // Start muted by default
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const setActiveVideo = (videoId: string | null) => {
    console.log(`setActiveVideo called with: ${videoId}, current: ${activeVideoId}`);
    console.log(`Registered videos: ${Array.from(videoRefs.current.keys()).join(', ')}`);
    
    // Just update the active video ID
    // The VideoPlayer components will handle play/pause based on this change
    setActiveVideoId(videoId);
  };

  const registerVideo = (videoId: string, element: HTMLVideoElement) => {
    console.log(`Registering video: ${videoId}`);
    videoRefs.current.set(videoId, element);
  };

  const unregisterVideo = (videoId: string) => {
    console.log(`Unregistering video: ${videoId}`);
    videoRefs.current.delete(videoId);
  };

  return (
    <VideoPlaybackContext.Provider
      value={{
        activeVideoId,
        setActiveVideo,
        registerVideo,
        unregisterVideo,
        globalMuted,
        setGlobalMuted,
      }}
    >
      {children}
    </VideoPlaybackContext.Provider>
  );
}