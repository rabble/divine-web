import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVideoPlayback } from './useVideoPlayback';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';

describe('useVideoPlayback', () => {
  it('returns video playback context when used within provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VideoPlaybackProvider>{children}</VideoPlaybackProvider>
    );

    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    expect(result.current).toEqual({
      activeVideoId: null,
      setActiveVideo: expect.any(Function),
      registerVideo: expect.any(Function),
      unregisterVideo: expect.any(Function)
    });
  });

  it('throws error when used outside provider', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useVideoPlayback());
    }).toThrow('useVideoPlayback must be used within a VideoPlaybackProvider');

    console.error = originalConsoleError;
  });

  it('provides correct function types', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VideoPlaybackProvider>{children}</VideoPlaybackProvider>
    );

    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    expect(typeof result.current.setActiveVideo).toBe('function');
    expect(typeof result.current.registerVideo).toBe('function');
    expect(typeof result.current.unregisterVideo).toBe('function');
  });
});