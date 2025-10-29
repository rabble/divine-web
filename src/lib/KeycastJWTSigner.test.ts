// ABOUTME: Tests for JWT-based Keycast signer
// ABOUTME: Verifies HTTP signing, encryption, and error handling

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeycastJWTSigner } from './KeycastJWTSigner';

// Mock fetch globally
const mockFetch = vi.fn();
// @ts-ignore - Mock fetch for testing
global.fetch = mockFetch;

describe('KeycastJWTSigner', () => {
  const mockToken = 'mock-jwt-token';
  const mockPubkey = 'a'.repeat(64); // 64-char hex pubkey
  const mockApiUrl = 'https://test.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create signer with token', () => {
      const signer = new KeycastJWTSigner({ token: mockToken });
      expect(signer).toBeDefined();
    });

    it('should use custom API URL if provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pubkey: mockPubkey }),
      });

      const signer = new KeycastJWTSigner({
        token: mockToken,
        apiUrl: mockApiUrl,
      });

      await signer.getPublicKey();

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/user/pubkey`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );
    });

    it('should use custom timeout if provided', () => {
      const signer = new KeycastJWTSigner({
        token: mockToken,
        timeout: 5000,
      });
      expect(signer).toBeDefined();
    });
  });

  describe('getPublicKey', () => {
    it('should fetch and return public key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pubkey: mockPubkey }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      const pubkey = await signer.getPublicKey();

      expect(pubkey).toBe(mockPubkey);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.divine.video/api/user/pubkey',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );
    });

    it('should cache public key after first call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pubkey: mockPubkey }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      // First call
      const pubkey1 = await signer.getPublicKey();
      expect(pubkey1).toBe(mockPubkey);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const pubkey2 = await signer.getPublicKey();
      expect(pubkey2).toBe(mockPubkey);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should throw error on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.getPublicKey()).rejects.toThrow('Invalid token');
    });

    it('should throw error on missing pubkey in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // No pubkey field
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.getPublicKey()).rejects.toThrow(
        'Invalid response: missing pubkey'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.getPublicKey()).rejects.toThrow('Network error');
    });
  });

  describe('signEvent', () => {
    const mockEvent = {
      kind: 1,
      content: 'Hello World',
      tags: [],
      created_at: 1234567890,
    };

    const mockSignedEvent = {
      ...mockEvent,
      id: 'event-id-123',
      pubkey: mockPubkey,
      sig: 'signature-123',
    };

    it('should sign event successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ event: mockSignedEvent }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      const signed = await signer.signEvent(mockEvent);

      expect(signed).toEqual(mockSignedEvent);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.divine.video/api/sign',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ event: mockEvent }),
        })
      );
    });

    it('should throw error on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.signEvent(mockEvent)).rejects.toThrow('Invalid token');
    });

    it('should throw error on missing signed event in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // No event field
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.signEvent(mockEvent)).rejects.toThrow(
        'Invalid response: missing signed event'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.signEvent(mockEvent)).rejects.toThrow('Network error');
    });
  });

  describe('getRelays', () => {
    it('should return empty object', async () => {
      const signer = new KeycastJWTSigner({ token: mockToken });
      const relays = await signer.getRelays();

      expect(relays).toEqual({});
    });
  });

  describe('nip04 encryption', () => {
    const targetPubkey = 'b'.repeat(64);
    const plaintext = 'secret message';
    const ciphertext = 'encrypted-message';

    it('should encrypt with NIP-04', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ciphertext }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      const result = await signer.nip04.encrypt(targetPubkey, plaintext);

      expect(result).toBe(ciphertext);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.divine.video/api/encrypt/nip04',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ pubkey: targetPubkey, plaintext }),
        })
      );
    });

    it('should decrypt with NIP-04', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plaintext }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      const result = await signer.nip04.decrypt(targetPubkey, ciphertext);

      expect(result).toBe(plaintext);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.divine.video/api/decrypt/nip04',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ pubkey: targetPubkey, ciphertext }),
        })
      );
    });

    it('should handle encryption errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Encryption failed' }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.nip04.encrypt(targetPubkey, plaintext)).rejects.toThrow(
        'Encryption failed'
      );
    });

    it('should handle decryption errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Decryption failed' }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.nip04.decrypt(targetPubkey, ciphertext)).rejects.toThrow(
        'Decryption failed'
      );
    });
  });

  describe('nip44 encryption', () => {
    const targetPubkey = 'b'.repeat(64);
    const plaintext = 'secret message';
    const ciphertext = 'encrypted-message';

    it('should encrypt with NIP-44', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ciphertext }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      const result = await signer.nip44.encrypt(targetPubkey, plaintext);

      expect(result).toBe(ciphertext);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.divine.video/api/encrypt/nip44',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ pubkey: targetPubkey, plaintext }),
        })
      );
    });

    it('should decrypt with NIP-44', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plaintext }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      const result = await signer.nip44.decrypt(targetPubkey, ciphertext);

      expect(result).toBe(plaintext);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.divine.video/api/decrypt/nip44',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ pubkey: targetPubkey, ciphertext }),
        })
      );
    });

    it('should handle encryption errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Encryption failed' }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.nip44.encrypt(targetPubkey, plaintext)).rejects.toThrow(
        'Encryption failed'
      );
    });

    it('should handle decryption errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Decryption failed' }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });

      await expect(signer.nip44.decrypt(targetPubkey, ciphertext)).rejects.toThrow(
        'Decryption failed'
      );
    });
  });

  describe('updateToken', () => {
    it('should update token and clear cached pubkey', async () => {
      // First call with original token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pubkey: mockPubkey }),
      });

      const signer = new KeycastJWTSigner({ token: mockToken });
      await signer.getPublicKey();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Update token
      const newToken = 'new-jwt-token';
      signer.updateToken(newToken);

      // Next call should fetch again with new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pubkey: mockPubkey }),
      });

      await signer.getPublicKey();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://oauth.divine.video/api/user/pubkey',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        })
      );
    });
  });
});
