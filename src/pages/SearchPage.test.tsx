// ABOUTME: Tests for comprehensive search page functionality
// ABOUTME: Tests search input, filter tabs, results display, and different search modes

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '@/test/TestApp';
import { SearchPage } from './SearchPage';
import { useSearchVideos } from '@/hooks/useSearchVideos';
import { useSearchUsers } from '@/hooks/useSearchUsers';
import { useSearchHashtags } from '@/hooks/useSearchHashtags';

// Mock the search hooks
vi.mock('@/hooks/useSearchVideos', () => ({
  useSearchVideos: vi.fn(),
}));

vi.mock('@/hooks/useSearchUsers', () => ({
  useSearchUsers: vi.fn(),
}));

vi.mock('@/hooks/useSearchHashtags', () => ({
  useSearchHashtags: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [
    new URLSearchParams(),
    vi.fn(),
  ],
  useNavigate: () => vi.fn(),
}));

const mockSearchVideos = useSearchVideos as any;
const mockSearchUsers = useSearchUsers as any;
const mockSearchHashtags = useSearchHashtags as any;

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSearchVideos.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    
    mockSearchUsers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    
    mockSearchHashtags.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it('should render search input and filter tabs', () => {
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    // Search input should be present
    expect(screen.getByPlaceholderText(/search for videos, users, or hashtags/i)).toBeInTheDocument();

    // Filter tabs should be present
    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /videos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /hashtags/i })).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);

    // Type rapidly
    await user.type(searchInput, 'test query');

    // Should not trigger search immediately
    expect(mockSearchVideos).not.toHaveBeenCalled();

    // Wait for debounce delay
    await waitFor(
      () => {
        expect(mockSearchVideos).toHaveBeenCalledWith({
          query: 'test query',
          limit: 20,
        });
      },
      { timeout: 1000 }
    );
  });

  it('should switch between filter tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'test');

    // Wait for initial search
    await waitFor(() => {
      expect(mockSearchVideos).toHaveBeenCalled();
    });

    // Switch to Users tab
    const usersTab = screen.getByRole('tab', { name: /users/i });
    await user.click(usersTab);

    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Hashtags tab
    const hashtagsTab = screen.getByRole('tab', { name: /hashtags/i });
    await user.click(hashtagsTab);

    expect(hashtagsTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Videos tab
    const videosTab = screen.getByRole('tab', { name: /videos/i });
    await user.click(videosTab);

    expect(videosTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should display video search results', async () => {
    const mockVideoResults = [
      {
        id: 'video1',
        pubkey: 'user1',
        createdAt: 1234567890,
        content: 'Amazing dance video',
        videoUrl: 'https://example.com/video1.mp4',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        title: 'Dance Video',
        hashtags: ['dance', 'music'],
        isRepost: false,
        vineId: 'video1',
      },
    ];

    mockSearchVideos.mockReturnValue({
      data: mockVideoResults,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'dance');

    await waitFor(() => {
      expect(screen.getByText('Dance Video')).toBeInTheDocument();
    });
  });

  it('should display user search results', async () => {
    const mockUserResults = [
      {
        pubkey: 'user1',
        metadata: {
          name: 'johndoe',
          display_name: 'John Doe',
          about: 'Video creator',
          picture: 'https://example.com/avatar.jpg',
        },
      },
    ];

    mockSearchUsers.mockReturnValue({
      data: mockUserResults,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'john');

    // Switch to Users tab
    const usersTab = screen.getByRole('tab', { name: /users/i });
    await user.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });
  });

  it('should display hashtag search results', async () => {
    const mockHashtagResults = [
      { tag: 'dance', count: 15 },
      { tag: 'music', count: 8 },
    ];

    mockSearchHashtags.mockReturnValue({
      data: mockHashtagResults,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'dan');

    // Switch to Hashtags tab
    const hashtagsTab = screen.getByRole('tab', { name: /hashtags/i });
    await user.click(hashtagsTab);

    await waitFor(() => {
      expect(screen.getByText('#dance')).toBeInTheDocument();
      expect(screen.getByText('15 videos')).toBeInTheDocument();
      expect(screen.getByText('#music')).toBeInTheDocument();
      expect(screen.getByText('8 videos')).toBeInTheDocument();
    });
  });

  it('should show loading states', async () => {
    mockSearchVideos.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText(/searching.../i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no results found', async () => {
    mockSearchVideos.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      expect(screen.getByText(/try another relay/i)).toBeInTheDocument();
    });
  });

  it('should handle search errors gracefully', async () => {
    mockSearchVideos.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Search failed'),
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'error');

    await waitFor(() => {
      expect(screen.getByText(/search error/i)).toBeInTheDocument();
    });
  });

  it('should show search suggestions when input is focused', async () => {
    const mockHashtagResults = [
      { tag: 'dance', count: 15 },
      { tag: 'music', count: 8 },
    ];

    mockSearchHashtags.mockReturnValue({
      data: mockHashtagResults,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    
    // Focus input should show popular hashtags as suggestions
    await user.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText(/popular hashtags/i)).toBeInTheDocument();
    });
  });

  it('should handle hashtag click from suggestions', async () => {
    const mockHashtagResults = [
      { tag: 'dance', count: 15 },
    ];

    mockSearchHashtags.mockReturnValue({
      data: mockHashtagResults,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('#dance')).toBeInTheDocument();
    });

    // Click on hashtag suggestion
    const hashtagSuggestion = screen.getByText('#dance');
    await user.click(hashtagSuggestion);

    // Should fill search input and trigger search
    expect(searchInput).toHaveValue('#dance');
  });

  it('should show results count', async () => {
    const mockVideoResults = [
      {
        id: 'video1',
        pubkey: 'user1',
        createdAt: 1234567890,
        content: 'Video 1',
        videoUrl: 'https://example.com/video1.mp4',
        hashtags: [],
        isRepost: false,
        vineId: 'video1',
      },
      {
        id: 'video2', 
        pubkey: 'user2',
        createdAt: 1234567891,
        content: 'Video 2',
        videoUrl: 'https://example.com/video2.mp4',
        hashtags: [],
        isRepost: false,
        vineId: 'video2',
      },
    ];

    mockSearchVideos.mockReturnValue({
      data: mockVideoResults,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText(/2 videos found/i)).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestApp>
        <SearchPage />
      </TestApp>
    );

    const searchInput = screen.getByPlaceholderText(/search for videos, users, or hashtags/i);
    
    // Tab should move to next focusable element
    await user.tab();
    expect(searchInput).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('tab', { name: /all/i })).toHaveFocus();

    // Arrow keys should navigate between tabs
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /videos/i })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /users/i })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /hashtags/i })).toHaveFocus();
  });
});