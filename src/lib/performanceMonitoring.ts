// ABOUTME: Performance monitoring and metrics collection
// ABOUTME: Tracks query times, feed loads, and user engagement

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface FeedLoadMetric {
  feedType: string;
  queryTime: number;
  parseTime: number;
  totalTime: number;
  videoCount: number;
  sortMode?: string;
  timestamp: number;
}

export interface QueryMetric {
  relayUrl: string;
  queryType: string;
  duration: number;
  eventCount: number;
  filters: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private feedMetrics: FeedLoadMetric[] = [];
  private queryMetrics: QueryMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Record a generic performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    this.trimMetrics();

    // Emit event for external monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-metric', {
        detail: metric
      }));
    }
  }

  /**
   * Record a feed load event
   */
  recordFeedLoad(metric: Omit<FeedLoadMetric, 'timestamp'>) {
    const fullMetric: FeedLoadMetric = {
      ...metric,
      timestamp: Date.now()
    };

    this.feedMetrics.push(fullMetric);
    this.trimMetrics();

    console.log(`[Performance] Feed ${metric.feedType} loaded in ${metric.totalTime}ms (query: ${metric.queryTime}ms, parse: ${metric.parseTime}ms, videos: ${metric.videoCount})`);
  }

  /**
   * Record a relay query
   */
  recordQuery(metric: Omit<QueryMetric, 'timestamp'>) {
    const fullMetric: QueryMetric = {
      ...metric,
      timestamp: Date.now()
    };

    this.queryMetrics.push(fullMetric);
    this.trimMetrics();

    console.log(`[Performance] Query ${metric.queryType} to ${metric.relayUrl} took ${metric.duration}ms (${metric.eventCount} events)`);
  }

  /**
   * Get statistics for a metric
   */
  getStats(metricName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const values = this.metrics
      .filter(m => m.name === metricName)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const p50 = values[Math.floor(values.length * 0.5)];
    const p95 = values[Math.floor(values.length * 0.95)];
    const p99 = values[Math.floor(values.length * 0.99)];

    return { count: values.length, avg, min, max, p50, p95, p99 };
  }

  /**
   * Get feed load statistics
   */
  getFeedLoadStats(feedType?: string): {
    count: number;
    avgQueryTime: number;
    avgTotalTime: number;
    avgVideoCount: number;
  } {
    const relevantMetrics = feedType
      ? this.feedMetrics.filter(m => m.feedType === feedType)
      : this.feedMetrics;

    if (relevantMetrics.length === 0) {
      return { count: 0, avgQueryTime: 0, avgTotalTime: 0, avgVideoCount: 0 };
    }

    const count = relevantMetrics.length;
    const avgQueryTime = relevantMetrics.reduce((sum, m) => sum + m.queryTime, 0) / count;
    const avgTotalTime = relevantMetrics.reduce((sum, m) => sum + m.totalTime, 0) / count;
    const avgVideoCount = relevantMetrics.reduce((sum, m) => sum + m.videoCount, 0) / count;

    return { count, avgQueryTime, avgTotalTime, avgVideoCount };
  }

  /**
   * Get query statistics by relay
   */
  getQueryStatsByRelay(relayUrl?: string) {
    const relevantQueries = relayUrl
      ? this.queryMetrics.filter(q => q.relayUrl === relayUrl)
      : this.queryMetrics;

    if (relevantQueries.length === 0) {
      return { count: 0, avgDuration: 0, avgEvents: 0 };
    }

    const count = relevantQueries.length;
    const avgDuration = relevantQueries.reduce((sum, q) => sum + q.duration, 0) / count;
    const avgEvents = relevantQueries.reduce((sum, q) => sum + q.eventCount, 0) / count;

    return { count, avgDuration, avgEvents };
  }

  /**
   * Get all metrics for export/analysis
   */
  exportMetrics() {
    return {
      metrics: [...this.metrics],
      feedMetrics: [...this.feedMetrics],
      queryMetrics: [...this.queryMetrics],
      stats: {
        totalMetrics: this.metrics.length,
        totalFeedLoads: this.feedMetrics.length,
        totalQueries: this.queryMetrics.length
      }
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.feedMetrics = [];
    this.queryMetrics = [];
  }

  /**
   * Trim metrics to max size
   */
  private trimMetrics() {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    if (this.feedMetrics.length > this.maxMetrics) {
      this.feedMetrics = this.feedMetrics.slice(-this.maxMetrics);
    }
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    console.group('[Performance Summary]');
    
    // Feed load stats
    console.log('Feed Loads:');
    const feedTypes = [...new Set(this.feedMetrics.map(m => m.feedType))];
    feedTypes.forEach(feedType => {
      const stats = this.getFeedLoadStats(feedType);
      console.log(`  ${feedType}: ${stats.count} loads, avg ${stats.avgTotalTime.toFixed(0)}ms, ${stats.avgVideoCount.toFixed(0)} videos`);
    });

    // Query stats
    console.log('\nRelay Queries:');
    const relays = [...new Set(this.queryMetrics.map(q => q.relayUrl))];
    relays.forEach(relay => {
      const stats = this.getQueryStatsByRelay(relay);
      console.log(`  ${relay}: ${stats.count} queries, avg ${stats.avgDuration.toFixed(0)}ms, ${stats.avgEvents.toFixed(0)} events`);
    });

    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { performanceMonitor: PerformanceMonitor }).performanceMonitor = performanceMonitor;
}

/**
 * Utility to measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Utility to measure sync function execution time
 */
export function measure<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration, { ...metadata, error: true });
    throw error;
  }
}
