// ABOUTME: Integration tests for feed routing functionality
// ABOUTME: Tests different feed type routes (home, discovery, trending, hashtag, profile)

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TestApp } from '@/test/TestApp';
import AppRouter from '@/AppRouter';

describe('Feed Routing Integration', () => {
  it('should render discovery feed at /discovery route', () => {
    render(
      <TestApp>
        <MemoryRouter initialEntries={['/discovery']}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Should render VideoFeed with discovery feedType
    expect(screen.getByTestId('video-feed-discovery')).toBeInTheDocument();
  });

  it('should render home feed at /home route', () => {
    render(
      <TestApp>
        <MemoryRouter initialEntries={['/home']}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Should render VideoFeed with home feedType
    expect(screen.getByTestId('video-feed-home')).toBeInTheDocument();
  });

  it('should render trending feed at /trending route', () => {
    render(
      <TestApp>
        <MemoryRouter initialEntries={['/trending']}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Should render VideoFeed with trending feedType
    expect(screen.getByTestId('video-feed-trending')).toBeInTheDocument();
  });

  it('should render hashtag feed at /hashtag/:tag route', () => {
    render(
      <TestApp>
        <MemoryRouter initialEntries={['/hashtag/divine']}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Should render VideoFeed with hashtag feedType and tag prop
    expect(screen.getByTestId('video-feed-hashtag')).toBeInTheDocument();
    expect(screen.getByTestId('feed-hashtag-divine')).toBeInTheDocument();
  });

  it('should render profile feed at /profile/:npub route', () => {
    const testNpub = 'npub1test123';
    render(
      <TestApp>
        <MemoryRouter initialEntries={[`/profile/${testNpub}`]}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Should render VideoFeed with profile feedType and pubkey prop
    expect(screen.getByTestId('video-feed-profile')).toBeInTheDocument();
    expect(screen.getByTestId('feed-profile-npub1test123')).toBeInTheDocument();
  });

  it('should render discovery feed by default at root route', () => {
    render(
      <TestApp>
        <MemoryRouter initialEntries={['/']}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Root should default to discovery feed
    expect(screen.getByTestId('video-feed-discovery')).toBeInTheDocument();
  });

  it('should render 404 for unknown routes', () => {
    render(
      <TestApp>
        <MemoryRouter initialEntries={['/unknown-route']}>
          <AppRouter />
        </MemoryRouter>
      </TestApp>
    );

    // Should render NotFound page
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});