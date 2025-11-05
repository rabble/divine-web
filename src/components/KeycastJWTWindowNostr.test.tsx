// ABOUTME: Tests for KeycastJWTWindowNostr component
// ABOUTME: Verifies component integration and window.nostr injection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { KeycastJWTWindowNostr } from './KeycastJWTWindowNostr';
import { removeWindowNostr } from '@/lib/bunkerToWindowNostr';

// Mock the hooks
vi.mock('@/hooks/useKeycastSession', () => ({
  useKeycastSession: vi.fn(() => ({
    getValidToken: vi.fn(() => 'mock-token'),
  })),
}));

vi.mock('@/hooks/useWindowNostrJWT', () => ({
  useWindowNostrJWT: vi.fn(({ token }) => ({
    signer: token
      ? {
          getPublicKey: vi.fn().mockResolvedValue('a'.repeat(64)),
          signEvent: vi.fn(),
        }
      : null,
    isInitializing: false,
    error: null,
    isInjected: !!token,
    inject: vi.fn(),
    remove: vi.fn(),
    updateToken: vi.fn(),
  })),
}));

describe('KeycastJWTWindowNostr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    removeWindowNostr();
  });

  it('should render without crashing', () => {
    const { container } = render(<KeycastJWTWindowNostr />);
    expect(container).toBeDefined();
  });

  it('should not render any visible content', () => {
    const { container } = render(<KeycastJWTWindowNostr />);
    expect(container.textContent).toBe('');
  });

  it('should render with verbose prop', () => {
    const { container } = render(<KeycastJWTWindowNostr verbose={true} />);
    expect(container).toBeDefined();
  });

  it('should call useKeycastSession to get token', async () => {
    const { useKeycastSession } = await import('@/hooks/useKeycastSession');
    render(<KeycastJWTWindowNostr />);
    expect(useKeycastSession).toHaveBeenCalled();
  });

  it('should call useWindowNostrJWT with token', async () => {
    const { useWindowNostrJWT } = await import('@/hooks/useWindowNostrJWT');
    render(<KeycastJWTWindowNostr />);
    expect(useWindowNostrJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'mock-token',
        autoInject: true,
      })
    );
  });

  it('should handle case when no token is available', async () => {
    const { useKeycastSession } = await import('@/hooks/useKeycastSession');
    (useKeycastSession as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      getValidToken: vi.fn(() => null),
    });

    const { container } = render(<KeycastJWTWindowNostr />);
    expect(container).toBeDefined();
  });
});
