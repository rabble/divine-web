import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TagPage } from './TagPage';
import { TestApp } from '@/test/TestApp';

// Mock the useParams hook
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

describe('TagPage', () => {
  it('renders tag page with tag name', () => {
    mockUseParams.mockReturnValue({ tag: 'sehun' });
    
    render(
      <TestApp>
        <MemoryRouter>
          <TagPage />
        </MemoryRouter>
      </TestApp>
    );
    
    expect(screen.getByText('#sehun')).toBeInTheDocument();
  });

  it('shows video count for tag', () => {
    mockUseParams.mockReturnValue({ tag: 'bitcoin' });
    
    render(
      <TestApp>
        <MemoryRouter>
          <TagPage />
        </MemoryRouter>
      </TestApp>
    );
    
    expect(screen.getByText('#bitcoin')).toBeInTheDocument();
    expect(screen.getByTestId('tag-video-count')).toBeInTheDocument();
  });

  it('renders video feed for the tag', () => {
    mockUseParams.mockReturnValue({ tag: 'music' });
    
    render(
      <TestApp>
        <MemoryRouter>
          <TagPage />
        </MemoryRouter>
      </TestApp>
    );
    
    expect(screen.getByTestId('video-feed-hashtag')).toBeInTheDocument();
  });

  it('handles missing tag parameter', () => {
    mockUseParams.mockReturnValue({ tag: undefined });
    
    render(
      <TestApp>
        <MemoryRouter>
          <TagPage />
        </MemoryRouter>
      </TestApp>
    );
    
    expect(screen.getByText('Tag not found')).toBeInTheDocument();
  });
});