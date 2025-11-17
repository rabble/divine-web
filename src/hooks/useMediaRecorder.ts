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

  // Initialize MediaRecorder (called once at the start)
  const initializeRecorder = useCallback(() => {
    if (!streamRef.current) {
      console.error('No stream available');
      return false;
    }

    const mimeType = getSupportedMimeType();
    console.log('Creating MediaRecorder with mimeType:', mimeType);

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Data available, size:', event.data.size);
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: 'Recording Error',
          description: 'An error occurred during recording. Please try again.',
          variant: 'destructive',
        });
      };

      mediaRecorderRef.current = recorder;
      console.log('MediaRecorder initialized');
      return true;
    } catch (error) {
      console.error('Failed to create MediaRecorder:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to create recorder. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getSupportedMimeType, toast]);

  // Start recording a new segment
  const startSegment = useCallback(() => {
    console.log('startSegment called', {
      hasStream: !!streamRef.current,
      currentDuration: totalDurationRef.current,
      maxDuration: MAX_DURATION,
      currentRecorderState: mediaRecorderRef.current?.state,
    });

    if (!streamRef.current || totalDurationRef.current >= MAX_DURATION) {
      console.log('Cannot start segment - conditions not met');
      return;
    }

    // Initialize recorder if it doesn't exist
    if (!mediaRecorderRef.current) {
      const initialized = initializeRecorder();
      if (!initialized) return;
    }

    const recorder = mediaRecorderRef.current!;

    // If paused, resume
    if (recorder.state === 'paused') {
      console.log('Resuming recording');
      segmentStartTimeRef.current = Date.now();
      recorder.resume();
    }
    // If inactive, start fresh
    else if (recorder.state === 'inactive') {
      console.log('Starting recording');
      chunksRef.current = [];
      segmentStartTimeRef.current = Date.now();

      try {
        // Request data every 100ms so we can track segments
        recorder.start(100);
        console.log('MediaRecorder started');
      } catch (error) {
        console.error('Failed to start MediaRecorder:', error);
        toast({
          title: 'Recording Error',
          description: 'Failed to start recording. Please try again.',
          variant: 'destructive',
        });
        return;
      }
    }
    // Already recording
    else {
      console.log('Already recording');
      return;
    }

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
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        // Update duration
        const finalElapsed = Date.now() - segmentStartTimeRef.current;
        totalDurationRef.current += finalElapsed;

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: true,
          currentDuration: totalDurationRef.current,
          progress: 1,
        }));
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, [getSupportedMimeType, toast, initializeRecorder]);

  // Stop current recording segment (pause, not stop - keeps stream alive)
  const stopSegment = useCallback(() => {
    console.log('stopSegment called', {
      recorderState: mediaRecorderRef.current?.state,
      hasInterval: !!progressIntervalRef.current,
    });

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Pausing MediaRecorder');
      mediaRecorderRef.current.pause();

      // Update total duration
      const elapsed = Date.now() - segmentStartTimeRef.current;
      totalDurationRef.current += elapsed;
      console.log('Segment paused, duration:', elapsed, 'total:', totalDurationRef.current);
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: true,
      currentDuration: totalDurationRef.current,
      progress: Math.min(totalDurationRef.current / MAX_DURATION, 1),
    }));
  }, []);

  // Finalize recording and create the final blob
  const finalizeRecording = useCallback(() => {
    return new Promise<RecordingSegment[]>((resolve) => {
      if (!mediaRecorderRef.current) {
        console.log('No recorder to finalize');
        resolve([]);
        return;
      }

      const recorder = mediaRecorderRef.current;

      // If recording or paused, we need to stop to get the final data
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        console.log('Stopping recorder to finalize, current state:', recorder.state);

        // Set up onstop to create the final segment
        recorder.onstop = () => {
          console.log('Recorder stopped, creating final segment', {
            chunksCount: chunksRef.current.length,
            totalSize: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
          });

          if (chunksRef.current.length === 0) {
            console.log('No chunks recorded');
            resolve([]);
            return;
          }

          const mimeType = getSupportedMimeType();
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);

          const segment: RecordingSegment = {
            startTime: new Date(Date.now() - totalDurationRef.current),
            endTime: new Date(),
            duration: totalDurationRef.current,
            blobUrl,
            blob,
          };

          setState(prev => ({
            ...prev,
            segments: [segment],
            isRecording: false,
            isPaused: false,
          }));

          console.log('Final segment created');
          resolve([segment]);
        };

        // Stop the recorder
        recorder.stop();
      } else {
        console.log('Recorder already inactive');
        resolve(state.segments);
      }
    });
  }, [getSupportedMimeType, state.segments]);

  // Reset recording (discard all segments)
  const reset = useCallback(() => {
    // Stop any active recording
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      if (state === 'recording' || state === 'paused') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Revoke all blob URLs to free memory
    state.segments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
    });

    chunksRef.current = [];
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
    finalizeRecording,
    reset,
    canRecord: state.currentDuration < MAX_DURATION,
    remainingDuration: Math.max(0, MAX_DURATION - state.currentDuration),
  };
}
