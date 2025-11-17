// ABOUTME: React hook for tracking performance metrics
// ABOUTME: Monitors feed loads, query times, and user engagement

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/performanceMonitoring';

/**
 * Track when a component mounts and unmounts
 */
export function useComponentLifecycle(componentName: string) {
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const timeToMount = Date.now() - mountTime.current;
    performanceMonitor.recordMetric(`${componentName}.mount`, timeToMount);

    return () => {
      const timeAlive = Date.now() - mountTime.current;
      performanceMonitor.recordMetric(`${componentName}.lifetime`, timeAlive);
    };
  }, [componentName]);
}

/**
 * Track feed loading performance
 */
export function useFeedLoadMetric(
  feedType: string,
  isLoading: boolean,
  videoCount: number,
  sortMode?: string
) {
  const loadStartTime = useRef<number>();

  useEffect(() => {
    if (isLoading && !loadStartTime.current) {
      loadStartTime.current = Date.now();
    }

    if (!isLoading && loadStartTime.current) {
      const totalTime = Date.now() - loadStartTime.current;
      
      performanceMonitor.recordFeedLoad({
        feedType,
        queryTime: totalTime, // Approximate
        parseTime: 0, // Not measured separately
        totalTime,
        videoCount,
        sortMode
      });

      loadStartTime.current = undefined;
    }
  }, [isLoading, feedType, videoCount, sortMode]);
}

/**
 * Track time spent on a page
 */
export function usePageViewMetric(pageName: string) {
  const enterTime = useRef(Date.now());

  useEffect(() => {
    enterTime.current = Date.now();

    return () => {
      const timeOnPage = Date.now() - enterTime.current;
      performanceMonitor.recordMetric(`page.${pageName}.duration`, timeOnPage);
    };
  }, [pageName]);
}

/**
 * Track video playback metrics
 */
export function useVideoPlayMetric(videoId: string) {
  const playStartTime = useRef<number>();

  const onPlay = () => {
    playStartTime.current = Date.now();
  };

  const onPause = () => {
    if (playStartTime.current) {
      const watchTime = Date.now() - playStartTime.current;
      performanceMonitor.recordMetric('video.watch-time', watchTime, {
        videoId
      });
      playStartTime.current = undefined;
    }
  };

  const onEnded = () => {
    if (playStartTime.current) {
      const watchTime = Date.now() - playStartTime.current;
      performanceMonitor.recordMetric('video.completed', watchTime, {
        videoId
      });
      playStartTime.current = undefined;
    }
  };

  return { onPlay, onPause, onEnded };
}

/**
 * Export performance summary for debugging
 */
export function usePerformanceSummary() {
  useEffect(() => {
    // Log summary every 5 minutes
    const interval = setInterval(() => {
      performanceMonitor.logSummary();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

/**
 * Expose performance data to window for debugging
 */
if (typeof window !== 'undefined') {
  (window as typeof window & {
    getPerformanceStats: () => void;
    clearPerformanceStats: () => void;
  }).getPerformanceStats = () => {
    performanceMonitor.logSummary();
    return performanceMonitor.exportMetrics();
  };

  (window as typeof window & {
    clearPerformanceStats: () => void;
  }).clearPerformanceStats = () => {
    performanceMonitor.clear();
    console.log('[Performance] All metrics cleared');
  };
}
