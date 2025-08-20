import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashtagPage } from './HashtagPage';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';
import type { ParsedVideoData } from '@/types/video';

// Mock react-router-dom
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as Record<string, unknown>;
  return {
    ...actual,
    useParams: () => mockUseParams(),
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => <a href={to} {...props}>{children}</a>
  };
});

// Mock video events hook
const mockVideoEventsData: ParsedVideoData[] = [
  {
    id: 'video-1',
    pubkey: 'author-1',
    createdAt: 1640995200,
    content: 'First video about #bitcoin',
    videoUrl: 'https://nostr.build/video1.mp4',
    hashtags: ['bitcoin', 'crypto'],
    isRepost: false,
    vineId: 'vine-1'
  },
  {
    id: 'video-2',
    pubkey: 'author-2',
    createdAt: 1640995300,
    content: 'Second #bitcoin video',
    videoUrl: 'https://nostr.build/video2.mp4',
    hashtags: ['bitcoin'],
    isRepost: false,
    vineId: 'vine-2'
  }
];

// Mock video events hook
const mockUseVideoEvents = vi.fn();
vi.mock('@/hooks/useVideoEvents', () => ({
  useVideoEvents: () => mockUseVideoEvents()
}));

// Mock VideoFeed component 
vi.mock('@/components/VideoFeed', () => ({
  VideoFeed: ({ feedType, hashtag, className, 'data-testid': testId }: { 
    feedType?: string; 
    hashtag?: string; 
    className?: string; 
    'data-testid'?: string 
  }) => (
    <div className={className} data-testid={testId}>
      <div>VideoFeed for {feedType} - {hashtag}</div>
      <div>Mock video feed content</div>
    </div>
  )
}));

// Mock useAuthor hook
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: () => ({
    data: {
      metadata: {
        name: 'Test Author',
        picture: 'https://example.com/avatar.jpg'
      }
    }
  })
}));

describe('HashtagPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVideoEvents.mockReturnValue({
      data: mockVideoEventsData,
      isLoading: false,
      error: null,
      isSuccess: true
    });
  });

  const renderHashtagPage = () => {
    return render(
      <TestApp>
        <VideoPlaybackProvider>
          <HashtagPage />
        </VideoPlaybackProvider>
      </TestApp>
    );
  };

  it('should render hashtag title and description', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    expect(screen.getByText(/videos tagged with #bitcoin/i)).toBeInTheDocument();
  });

  it('should show video count in header', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    expect(screen.getByText('2 videos')).toBeInTheDocument();
  });

  it('should render view toggle buttons', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Feed')).toBeInTheDocument();
  });

  it('should toggle between grid and feed views', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    const gridButton = screen.getByText('Grid');
    const feedButton = screen.getByText('Feed');

    // Default should be feed view
    expect(feedButton).toHaveAttribute('aria-pressed', 'true');
    expect(gridButton).toHaveAttribute('aria-pressed', 'false');

    // Click grid button
    fireEvent.click(gridButton);
    
    expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    expect(feedButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should render related hashtags section', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    expect(screen.getByText('Related Hashtags')).toBeInTheDocument();
    expect(screen.getByText('#crypto')).toBeInTheDocument();
  });

  it('should make related hashtags clickable', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    const cryptoLink = screen.getByText('#crypto').closest('a');
    expect(cryptoLink).toHaveAttribute('href', '/hashtag/crypto');
  });

  it('should render video feed with correct props', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    expect(screen.getByText('VideoFeed for hashtag - bitcoin')).toBeInTheDocument();
    expect(screen.getByTestId('video-feed-hashtag')).toBeInTheDocument();
  });

  it('should handle missing hashtag parameter', () => {
    mockUseParams.mockReturnValue({ tag: undefined });
    renderHashtagPage();

    expect(screen.getByText('Invalid Hashtag')).toBeInTheDocument();
    expect(screen.getByText('No hashtag specified in the URL')).toBeInTheDocument();
  });

  it('should handle empty hashtag parameter', () => {
    mockUseParams.mockReturnValue({ tag: '' });
    renderHashtagPage();

    expect(screen.getByText('Invalid Hashtag')).toBeInTheDocument();
  });

  it('should show loading state while fetching videos', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false
    });

    renderHashtagPage();

    // Should show skeleton in header video count
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle zero videos for hashtag', () => {
    mockUseParams.mockReturnValue({ tag: 'nonexistent' });
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true
    });

    renderHashtagPage();

    expect(screen.getByText('0 videos')).toBeInTheDocument();
    expect(screen.getByText('No related hashtags')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      isSuccess: false
    });

    renderHashtagPage();

    expect(screen.getByText(/failed to load videos/i)).toBeInTheDocument();
  });

  it('should calculate related hashtags correctly', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    // bitcoin videos also contain 'crypto' hashtag
    expect(screen.getByText('#crypto')).toBeInTheDocument();
    
    // Should not show the current hashtag in related
    expect(screen.queryByText('Related Hashtags')).toBeInTheDocument();
    const relatedSection = screen.getByText('Related Hashtags').parentElement;
    expect(relatedSection).not.toHaveTextContent('#bitcoin');
  });

  it('should sort related hashtags by frequency', () => {
    // Add more test data with different frequencies
    const extendedData: ParsedVideoData[] = [
      ...mockVideoEventsData,
      {
        id: 'video-3',
        pubkey: 'author-3',
        createdAt: 1640995400,
        content: 'Another #bitcoin video with #nostr',
        videoUrl: 'https://nostr.build/video3.mp4',
        hashtags: ['bitcoin', 'nostr', 'crypto'],
        isRepost: false,
        vineId: 'vine-3'
      }
    ];

    mockUseVideoEvents.mockReturnValue({
      data: extendedData,
      isLoading: false,
      error: null,
      isSuccess: true
    });

    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    // crypto appears in 2 videos, nostr in 1 video
    const relatedHashtags = screen.getAllByText(/^#/);
    const relatedText = relatedHashtags.map(el => el.textContent);
    
    // crypto should appear before nostr
    const cryptoIndex = relatedText.indexOf('#crypto');
    const nostrIndex = relatedText.indexOf('#nostr');
    expect(cryptoIndex).toBeLessThan(nostrIndex);
  });

  it('should limit number of related hashtags shown', () => {
    // Create data with many hashtags
    const manyHashtagsData: ParsedVideoData[] = [
      {
        id: 'video-1',
        pubkey: 'author-1',
        createdAt: 1640995200,
        content: '#bitcoin video',
        videoUrl: 'https://nostr.build/video1.mp4',
        hashtags: ['bitcoin', 'crypto', 'nostr', 'development', 'web3', 'decentralized'],
        isRepost: false,
        vineId: 'vine-1'
      }
    ];

    mockUseVideoEvents.mockReturnValue({
      data: manyHashtagsData,
      isLoading: false,
      error: null,
      isSuccess: true
    });

    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    // Should limit to reasonable number (e.g., 5 related hashtags)
    const relatedSection = screen.getByText('Related Hashtags').parentElement;
    const relatedHashtags = relatedSection?.querySelectorAll('a') || [];
    expect(relatedHashtags.length).toBeLessThanOrEqual(5);
  });

  it('should handle hashtag with special characters', () => {
    mockUseParams.mockReturnValue({ tag: 'web3' });
    renderHashtagPage();

    expect(screen.getByText('#web3')).toBeInTheDocument();
    expect(screen.getByText(/videos tagged with #web3/i)).toBeInTheDocument();
  });

  it('should maintain case sensitivity in display', () => {
    mockUseParams.mockReturnValue({ tag: 'Bitcoin' });
    renderHashtagPage();

    expect(screen.getByText('#Bitcoin')).toBeInTheDocument();
  });

  it('should show view toggle in correct state', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    const viewToggle = screen.getByRole('group');
    expect(viewToggle).toBeInTheDocument();
    
    // Should have proper ARIA attributes
    const feedButton = screen.getByText('Feed');
    const gridButton = screen.getByText('Grid');
    
    expect(feedButton).toHaveAttribute('role', 'button');
    expect(gridButton).toHaveAttribute('role', 'button');
  });

  it('should render back button', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    const backButton = screen.getByText('← Back to Discovery');
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest('a')).toHaveAttribute('href', '/hashtags');
  });

  it('should apply different layouts for grid vs feed view', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    renderHashtagPage();

    // Switch to grid view
    const gridButton = screen.getByText('Grid');
    fireEvent.click(gridButton);

    // Should apply grid-specific classes or data attributes
    const videoFeed = screen.getByTestId('video-feed-hashtag');
    expect(videoFeed).toHaveClass(/grid/);
  });
});