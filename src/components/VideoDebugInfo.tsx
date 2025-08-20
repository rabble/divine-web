// ABOUTME: Debug component to display video playback state information
// ABOUTME: Shows which videos are registered and which one is active

import { useVideoPlayback } from '@/hooks/useVideoPlayback';

export function VideoDebugInfo() {
  const { activeVideoId, globalMuted } = useVideoPlayback();

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-sm">
      <h3 className="font-bold mb-2">Video Playback Debug</h3>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Active Video:</span>{' '}
          <span className="text-green-400">{activeVideoId || 'none'}</span>
        </div>
        <div>
          <span className="text-gray-400">Global Muted:</span>{' '}
          <span className={globalMuted ? "text-red-400" : "text-green-400"}>{globalMuted ? 'muted' : 'unmuted'}</span>
        </div>
        <div className="text-gray-500 text-[10px] mt-2">
          Check console for detailed logs
        </div>
      </div>
    </div>
  );
}