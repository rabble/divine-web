// ABOUTME: Camera recording component with Vine-style press-to-record interface
// ABOUTME: Provides live camera preview and touch/click recording controls

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Repeat, X } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { cn } from '@/lib/utils';

interface CameraRecorderProps {
  onRecordingComplete: (segments: { blob: Blob; blobUrl: string }[]) => void;
  onCancel: () => void;
}

export function CameraRecorder({ onRecordingComplete, onCancel }: CameraRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHoldingRecord, setIsHoldingRecord] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const {
    isInitialized,
    isRecording,
    progress,
    currentDuration,
    segments,
    cameraStream,
    initialize,
    switchCamera,
    startSegment,
    stopSegment,
    reset,
    canRecord,
    remainingDuration,
  } = useMediaRecorder();

  // Initialize camera on mount
  useEffect(() => {
    initialize().catch(error => {
      setCameraError(error.message || 'Failed to access camera');
    });
  }, [initialize]);

  // Attach camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Handle press-to-record interaction
  const handleRecordStart = () => {
    if (!canRecord) return;
    setIsHoldingRecord(true);
    startSegment();
  };

  const handleRecordStop = () => {
    setIsHoldingRecord(false);
    stopSegment();
  };

  // Finish recording and return segments
  const handleFinish = () => {
    if (segments.length === 0) {
      onCancel();
      return;
    }

    onRecordingComplete(segments.map(seg => ({
      blob: seg.blob,
      blobUrl: seg.blobUrl,
    })));
  };

  // Format duration for display
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white p-8">
        <Camera className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Camera Access Required</h2>
        <p className="text-center text-muted-foreground mb-4">{cameraError}</p>
        <Button onClick={onCancel} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-white">
          <Camera className="h-12 w-12 mb-2 animate-pulse mx-auto" />
          <p>Initializing camera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Camera Preview */}
      <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-red-500 transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Duration display */}
        <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full">
          <span className="text-white text-sm font-medium">
            {formatDuration(currentDuration)} / 6.0s
          </span>
        </div>

        {/* Close button */}
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Recording</span>
          </div>
        )}

        {/* Segment indicators */}
        {segments.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            {segments.map((segment, index) => (
              <div key={index} className="bg-black/60 px-2 py-1 rounded text-white text-xs">
                Segment {index + 1}: {formatDuration(segment.duration)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black">
        <div className="flex items-center justify-center gap-4">
          {/* Switch camera button */}
          <Button
            onClick={switchCamera}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            disabled={isRecording}
          >
            <Repeat className="h-6 w-6" />
          </Button>

          {/* Record button (press and hold) */}
          <button
            onMouseDown={handleRecordStart}
            onMouseUp={handleRecordStop}
            onMouseLeave={handleRecordStop}
            onTouchStart={(e) => {
              e.preventDefault();
              handleRecordStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleRecordStop();
            }}
            disabled={!canRecord}
            className={cn(
              "w-20 h-20 rounded-full border-4 border-white transition-all",
              "flex items-center justify-center",
              "active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed",
              isHoldingRecord ? "bg-red-500 scale-110" : "bg-white/20"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full transition-all",
              isHoldingRecord ? "bg-red-600" : "bg-red-500"
            )} />
          </button>

          {/* Finish button */}
          <Button
            onClick={handleFinish}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            disabled={segments.length === 0}
          >
            <span className="text-lg">✓</span>
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-4">
          <p className="text-white/80 text-sm">
            {canRecord ? (
              <>Press and hold the red button to record</>
            ) : (
              <>Maximum duration reached</>
            )}
          </p>
          {segments.length > 0 && (
            <p className="text-white/60 text-xs mt-1">
              {segments.length} segment{segments.length !== 1 ? 's' : ''} recorded • {formatDuration(remainingDuration)} remaining
            </p>
          )}
        </div>

        {/* Reset button */}
        {segments.length > 0 && (
          <Button
            onClick={reset}
            variant="outline"
            size="sm"
            className="w-full mt-3"
            disabled={isRecording}
          >
            Start Over
          </Button>
        )}
      </div>
    </div>
  );
}
