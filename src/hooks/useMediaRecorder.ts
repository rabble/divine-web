// ABOUTME: Hook for managing web camera recording using MediaRecorder API
// ABOUTME: Provides press-to-record, release-to-pause Vine-style recording functionality

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

export interface RecordingSegment {
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  blobUrl: string;
  blob: Blob;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isInitialized: boolean;
  progress: number; // 0-1
  currentDuration: number; // milliseconds
  segments: RecordingSegment[];
  cameraStream: MediaStream | null;
}

const MAX_DURATION = 6000; // 6 seconds in milliseconds
const PROGRESS_UPDATE_INTERVAL = 50; // Update progress every 50ms

export function useMediaRecorder() {
  const { toast } = useToast();
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isInitialized: false,
    progress: 0,
    currentDuration: 0,
    segments: [],
    cameraStream: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const segmentStartTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const totalDurationRef = useRef<number>(0);

  // Get optimal video constraints based on device
  const getOptimalVideoConstraints = useCallback(() => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Mobile - always use square for consistent recording
      return {
        width: { ideal: 1080 },
        height: { ideal: 1080 },
        aspectRatio: { ideal: 1 },
      };
    } else {
      // Desktop - square for better desktop experience
      return {
        width: { ideal: 1080 },
        height: { ideal: 1080 },
        aspectRatio: { ideal: 1 },
      };
    }
  }, []);

  // Initialize camera
  const initialize = useCallback(async (useFrontCamera = true) => {
    try {
      // Debug logging for mobile
      console.log('Browser info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hasNavigator: !!navigator,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      });

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please use https:// instead of http://');
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        // Try to polyfill for older browsers
        if (navigator.getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia) {
          console.log('Using legacy getUserMedia API');
          // We have the old API, but we'll still throw an error because it's complex to polyfill
          throw new Error('Your browser uses an outdated camera API. Please update your browser or use Chrome, Safari, or Firefox.');
        }
        throw new Error('Camera API not supported. Please use a modern browser and ensure you are using HTTPS.');
      }

      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported. Please update your browser.');
      }

      console.log('Requesting camera and microphone access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: useFrontCamera ? 'user' : 'environment',
          ...getOptimalVideoConstraints(),
        },
        audio: true,
      });

      console.log('Camera access granted', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoSettings: stream.getVideoTracks()[0]?.getSettings(),
      });

      streamRef.current = stream;
      setState(prev => ({
        ...prev,
        isInitialized: true,
        cameraStream: stream,
      }));

      return stream;
    } catch (error) {
      console.error('Failed to access camera:', error);

      // Provide specific error messages based on error type
      let title = 'Camera Access Failed';
      let description = 'Unable to access camera and microphone.';

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('HTTPS') || error.message.includes('secure context')) {
          title = 'HTTPS Required';
          description = error.message;
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          title = 'Permission Denied';
          description = 'Camera access was denied. Please check your browser settings and allow camera/microphone access, then try again.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          title = 'No Camera Found';
          description = 'No camera or microphone was found on this device.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          title = 'Camera In Use';
          description = 'Camera is already in use by another application. Please close other apps and try again.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          title = 'Camera Constraints Error';
          description = 'Your camera doesn\'t support the required settings. Try a different device.';
        } else if (error.name === 'TypeError' || error.message.includes('not supported')) {
          title = 'Browser Not Supported';
          description = error.message || 'Your browser doesn\'t support camera access. Please use a modern browser like Chrome, Firefox, or Safari.';
        } else {
          description = error.message || 'An unknown error occurred while accessing the camera.';
        }
      }

      toast({
        title,
        description,
        variant: 'destructive',
      });

      throw error;
    }
  }, [toast, getOptimalVideoConstraints]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!streamRef.current) return;

    const currentFacingMode = streamRef.current.getVideoTracks()[0].getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    // Stop current stream
    streamRef.current.getTracks().forEach(track => track.stop());

    // Reinitialize with new camera
    await initialize(newFacingMode === 'user');
  }, [initialize]);

  // Get supported MIME type
  const getSupportedMimeType = useCallback((): string => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm'; // Fallback
  }, []);

  // Start recording a new segment
  const startSegment = useCallback(() => {
    if (!streamRef.current || state.currentDuration >= MAX_DURATION) {
      return;
    }

    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(streamRef.current, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const endTime = Date.now();
      const duration = endTime - segmentStartTimeRef.current;

      const segment: RecordingSegment = {
        startTime: new Date(segmentStartTimeRef.current),
        endTime: new Date(endTime),
        duration,
        blobUrl,
        blob,
      };

      totalDurationRef.current += duration;

      setState(prev => ({
        ...prev,
        segments: [...prev.segments, segment],
        currentDuration: totalDurationRef.current,
        progress: Math.min(totalDurationRef.current / MAX_DURATION, 1),
        isRecording: false,
      }));
    };

    mediaRecorderRef.current = recorder;
    segmentStartTimeRef.current = Date.now();

    recorder.start();

    setState(prev => ({
      ...prev,
      isRecording: true,
      isPaused: false,
    }));

    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - segmentStartTimeRef.current;
      const totalElapsed = totalDurationRef.current + elapsed;

      setState(prev => ({
        ...prev,
        currentDuration: totalElapsed,
        progress: Math.min(totalElapsed / MAX_DURATION, 1),
      }));

      // Auto-stop at max duration
      if (totalElapsed >= MAX_DURATION) {
        stopSegment();
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, [state.currentDuration, getSupportedMimeType]);

  // Stop current recording segment
  const stopSegment = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: true,
    }));
  }, []);

  // Reset recording (discard all segments)
  const reset = useCallback(() => {
    // Stop any active recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Revoke all blob URLs to free memory
    state.segments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
    });

    totalDurationRef.current = 0;

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      progress: 0,
      currentDuration: 0,
      segments: [],
    }));
  }, [state.segments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Revoke all blob URLs
      state.segments.forEach(segment => {
        URL.revokeObjectURL(segment.blobUrl);
      });
    };
  }, [state.segments]);

  return {
    ...state,
    initialize,
    switchCamera,
    startSegment,
    stopSegment,
    reset,
    canRecord: state.currentDuration < MAX_DURATION,
    remainingDuration: Math.max(0, MAX_DURATION - state.currentDuration),
  };
}
