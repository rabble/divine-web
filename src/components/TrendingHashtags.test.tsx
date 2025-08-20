import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendingHashtags } from './TrendingHashtags';
import { TestApp } from '@/test/TestApp';
import type { ParsedVideoData } from '@/types/video';
import { useVideoEvents } from '@/hooks/useVideoEvents';

// Mock video events hook
const mockVideoEventsData: ParsedVideoData[] = [
  {
    id: 'video-1',
    pubkey: 'author-1',
    createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
    content: 'Check out this #bitcoin content!',
    videoUrl: 'https://nostr.build/video1.mp4',
    hashtags: ['bitcoin', 'crypto'],
    isRepost: false,
    vineId: 'vine-1'
  },
  {
    id: 'video-2',
    pubkey: 'author-2',
    createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    content: 'More #bitcoin and #nostr content',
    videoUrl: 'https://nostr.build/video2.mp4',
    hashtags: ['bitcoin', 'nostr'],
    isRepost: false,
    vineId: 'vine-2'
  },
  {
    id: 'video-3',
    pubkey: 'author-3',
    createdAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    content: 'Learning #nostr development',
    videoUrl: 'https://nostr.build/video3.mp4',
    hashtags: ['nostr', 'development'],
    isRepost: false,
    vineId: 'vine-3'
  }
];

// Mock video events hook
vi.mock('@/hooks/useVideoEvents', () => ({
  useVideoEvents: vi.fn()
}));

describe('TrendingHashtags', () => {
  const mockUseVideoEvents = vi.mocked(useVideoEvents);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVideoEvents.mockReturnValue({
      data: mockVideoEventsData,
      isLoading: false,
      error: null,
      isSuccess: true
    });
  });

  const renderTrendingHashtags = (props = {}) => {
    return render(
      <TestApp>
        <TrendingHashtags {...props} />
      </TestApp>
    );
  };

  it('should render trending hashtags list', () => {
    renderTrendingHashtags();

    expect(screen.getByText('Trending Hashtags')).toBeInTheDocument();
    expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    expect(screen.getByText('#nostr')).toBeInTheDocument();
  });

  it('should show video counts for each hashtag', () => {
    renderTrendingHashtags();

    // bitcoin appears in 2 videos
    expect(screen.getByText('2 videos')).toBeInTheDocument();
    // nostr appears in 2 videos  
    expect(screen.getAllByText('2 videos')).toHaveLength(2);
  });

  it('should sort hashtags by frequency', () => {
    renderTrendingHashtags();

    const hashtagElements = screen.getAllByText(/^#/);
    const hashtags = hashtagElements.map(el => el.textContent);

    // bitcoin and nostr both have 2 videos, should be first
    expect(hashtags[0]).toMatch(/#(bitcoin|nostr)/);
    expect(hashtags[1]).toMatch(/#(bitcoin|nostr)/);
  });

  it('should handle loading state', () => {
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false
    });

    renderTrendingHashtags();

    expect(screen.getByText('Trending Hashtags')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle error state', () => {
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      isSuccess: false
    });

    renderTrendingHashtags();

    expect(screen.getByText('Failed to load trending hashtags')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true
    });

    renderTrendingHashtags();

    expect(screen.getByText('No trending hashtags found')).toBeInTheDocument();
  });

  it('should limit number of hashtags displayed', () => {
    renderTrendingHashtags({ limit: 2 });

    const hashtagElements = screen.getAllByText(/^#/);
    expect(hashtagElements.length).toBeLessThanOrEqual(2);
  });

  it('should show growth indicators for trending hashtags', () => {
    renderTrendingHashtags({ showGrowth: true });

    // Should show growth percentage or indicator
    expect(screen.getByText(/trending/i)).toBeInTheDocument();
  });

  it('should filter by time period', () => {
    renderTrendingHashtags({ period: '24h' });

    expect(mockUseVideoEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        feedType: 'trending',
        since: expect.any(Number)
      })
    );
  });

  it('should make hashtags clickable', () => {
    renderTrendingHashtags();

    const bitcoinLink = screen.getByText('#bitcoin').closest('a');
    expect(bitcoinLink).toHaveAttribute('href', '/hashtag/bitcoin');
  });

  it('should apply custom className', () => {
    renderTrendingHashtags({ className: 'custom-trending-class' });

    const container = document.querySelector('.custom-trending-class');
    expect(container).toBeInTheDocument();
  });

  it('should show correct data-testid', () => {
    renderTrendingHashtags({ 'data-testid': 'trending-hashtags-test' });

    expect(screen.getByTestId('trending-hashtags-test')).toBeInTheDocument();
  });

  it('should calculate hashtag statistics correctly', () => {
    renderTrendingHashtags({ showStats: true });

    // bitcoin: 2 videos, nostr: 2 videos, crypto: 1 video, development: 1 video
    expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    expect(screen.getByText('#nostr')).toBeInTheDocument();
    
    // Should show percentage or rank
    expect(screen.getByText(/rank/i)).toBeInTheDocument();
  });

  it('should handle hashtags with mixed content and tags sources', () => {
    const mixedData: ParsedVideoData[] = [
      {
        id: 'video-1',
        pubkey: 'author-1',
        createdAt: Date.now() - 60 * 60 * 1000,
        content: 'Video about #bitcoin', // hashtag in content
        videoUrl: 'https://nostr.build/video1.mp4',
        hashtags: ['nostr'], // hashtag in tags
        isRepost: false,
        vineId: 'vine-1'
      }
    ];

    mockUseVideoEvents.mockReturnValue({
      data: mixedData,
      isLoading: false,
      error: null,
      isSuccess: true
    });

    renderTrendingHashtags();

    expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    expect(screen.getByText('#nostr')).toBeInTheDocument();
  });
});