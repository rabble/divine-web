import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HashtagDiscoveryPage } from './HashtagDiscoveryPage';
import { TestApp } from '@/test/TestApp';
import type { ParsedVideoData } from '@/types/video';
import { useVideoEvents } from '@/hooks/useVideoEvents';

// Mock video events hook
const mockVideoEventsData: ParsedVideoData[] = [
  {
    id: 'video-1',
    pubkey: 'author-1',
    createdAt: Date.now() - 60 * 60 * 1000,
    content: 'Check out this #bitcoin content!',
    videoUrl: 'https://nostr.build/video1.mp4',
    hashtags: ['bitcoin', 'crypto'],
    isRepost: false,
    vineId: 'vine-1'
  },
  {
    id: 'video-2',
    pubkey: 'author-2',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    content: 'More #bitcoin and #nostr content',
    videoUrl: 'https://nostr.build/video2.mp4',
    hashtags: ['bitcoin', 'nostr'],
    isRepost: false,
    vineId: 'vine-2'
  },
  {
    id: 'video-3',
    pubkey: 'author-3',
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
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

// Mock TrendingHashtags component
vi.mock('@/components/TrendingHashtags', () => ({
  TrendingHashtags: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => (
    <div className={className} data-testid={testId || 'trending-hashtags'}>
      <h3>Trending Hashtags</h3>
      <div>Mock trending hashtags</div>
    </div>
  )
}));

describe('HashtagDiscoveryPage', () => {
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

  const renderHashtagDiscoveryPage = () => {
    return render(
      <TestApp>
        <HashtagDiscoveryPage />
      </TestApp>
    );
  };

  it('should render page title and description', () => {
    renderHashtagDiscoveryPage();

    expect(screen.getByText('Discover Hashtags')).toBeInTheDocument();
    expect(screen.getByText(/explore popular hashtags/i)).toBeInTheDocument();
  });

  it('should render trending hashtags section', () => {
    renderHashtagDiscoveryPage();

    expect(screen.getByText('Trending Hashtags')).toBeInTheDocument();
    expect(screen.getByTestId('trending-hashtags')).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderHashtagDiscoveryPage();

    const searchInput = screen.getByPlaceholderText(/search hashtags/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('should render popular hashtags grid', () => {
    renderHashtagDiscoveryPage();

    expect(screen.getByText('Popular Hashtags')).toBeInTheDocument();
    
    // Should show hashtag cards
    expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    expect(screen.getByText('#nostr')).toBeInTheDocument();
  });

  it('should show video counts for each hashtag', () => {
    renderHashtagDiscoveryPage();

    // bitcoin appears in 2 videos
    expect(screen.getByText('2 videos')).toBeInTheDocument();
  });

  it('should filter hashtags by search term', async () => {
    renderHashtagDiscoveryPage();

    const searchInput = screen.getByPlaceholderText(/search hashtags/i);
    fireEvent.change(searchInput, { target: { value: 'bit' } });

    await waitFor(() => {
      expect(screen.getByText('#bitcoin')).toBeInTheDocument();
      expect(screen.queryByText('#nostr')).not.toBeInTheDocument();
    });
  });

  it('should clear search when search term is empty', async () => {
    renderHashtagDiscoveryPage();

    const searchInput = screen.getByPlaceholderText(/search hashtags/i);
    
    // First filter
    fireEvent.change(searchInput, { target: { value: 'bit' } });
    await waitFor(() => {
      expect(screen.queryByText('#nostr')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('#bitcoin')).toBeInTheDocument();
      expect(screen.getByText('#nostr')).toBeInTheDocument();
    });
  });

  it('should make hashtag cards clickable', () => {
    renderHashtagDiscoveryPage();

    const bitcoinCard = screen.getByText('#bitcoin').closest('a');
    expect(bitcoinCard).toHaveAttribute('href', '/hashtag/bitcoin');

    const nostrCard = screen.getByText('#nostr').closest('a');
    expect(nostrCard).toHaveAttribute('href', '/hashtag/nostr');
  });

  it('should handle loading state', () => {
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false
    });

    renderHashtagDiscoveryPage();

    // Should show skeletons in popular hashtags section
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

    renderHashtagDiscoveryPage();

    expect(screen.getByText(/failed to load hashtags/i)).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true
    });

    renderHashtagDiscoveryPage();

    expect(screen.getByText(/no hashtags found/i)).toBeInTheDocument();
  });

  it('should sort hashtags by video count descending', () => {
    renderHashtagDiscoveryPage();

    const hashtagElements = screen.getAllByText(/^#/);
    const hashtags = hashtagElements
      .filter(el => el.closest('[data-testid="hashtag-card"]'))
      .map(el => el.textContent);

    // bitcoin and nostr both have 2 videos, should be before others
    expect(hashtags.indexOf('#bitcoin')).toBeLessThan(hashtags.indexOf('#development'));
    expect(hashtags.indexOf('#nostr')).toBeLessThan(hashtags.indexOf('#crypto'));
  });

  it('should show hashtag statistics', () => {
    renderHashtagDiscoveryPage();

    // Should show various counts
    expect(screen.getByText('2 videos')).toBeInTheDocument(); // bitcoin
    expect(screen.getAllByText('1 video')).toHaveLength(2); // crypto, development
  });

  it('should render hashtag cards with proper structure', () => {
    renderHashtagDiscoveryPage();

    const bitcoinCard = screen.getByTestId('hashtag-card-bitcoin');
    expect(bitcoinCard).toBeInTheDocument();
    
    // Should contain hashtag name and video count
    expect(bitcoinCard).toHaveTextContent('#bitcoin');
    expect(bitcoinCard).toHaveTextContent('2 videos');
  });

  it('should handle case-insensitive search', async () => {
    renderHashtagDiscoveryPage();

    const searchInput = screen.getByPlaceholderText(/search hashtags/i);
    fireEvent.change(searchInput, { target: { value: 'BIT' } });

    await waitFor(() => {
      expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    });
  });

  it('should show search results count', async () => {
    renderHashtagDiscoveryPage();

    const searchInput = screen.getByPlaceholderText(/search hashtags/i);
    fireEvent.change(searchInput, { target: { value: 'bit' } });

    await waitFor(() => {
      expect(screen.getByText(/1 hashtag found/i)).toBeInTheDocument();
    });
  });

  it('should handle no search results', async () => {
    renderHashtagDiscoveryPage();

    const searchInput = screen.getByPlaceholderText(/search hashtags/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no hashtags match your search/i)).toBeInTheDocument();
    });
  });

  it('should render grid layout for hashtag cards', () => {
    renderHashtagDiscoveryPage();

    const grid = document.querySelector('[class*="grid"]');
    expect(grid).toBeInTheDocument();
    
    // Should have responsive grid classes
    expect(grid).toHaveClass(/grid/);
  });

  it('should calculate hashtag frequencies correctly', () => {
    // Custom data to test frequency calculation
    const testData: ParsedVideoData[] = [
      {
        id: 'video-1',
        pubkey: 'author-1',
        createdAt: Date.now(),
        content: '#test1 #test2',
        videoUrl: 'https://example.com/video1.mp4',
        hashtags: [],
        isRepost: false,
        vineId: 'vine-1'
      },
      {
        id: 'video-2',
        pubkey: 'author-2',
        createdAt: Date.now(),
        content: '#test1',
        videoUrl: 'https://example.com/video2.mp4',
        hashtags: ['test2'],
        isRepost: false,
        vineId: 'vine-2'
      }
    ];

    mockUseVideoEvents.mockReturnValue({
      data: testData,
      isLoading: false,
      error: null,
      isSuccess: true
    });

    renderHashtagDiscoveryPage();

    // test1: 2 occurrences, test2: 2 occurrences
    expect(screen.getAllByText('2 videos')).toHaveLength(2);
  });
});