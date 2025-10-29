// ABOUTME: JWT-based Nostr signer that signs events via Keycast REST API
// ABOUTME: Implements NostrSigner interface with HTTP requests instead of NIP-46

import type { NostrEvent, NostrSigner } from '@nostrify/nostrify';

const KEYCAST_API_URL = 'https://oauth.divine.video';

export interface KeycastJWTSignerOptions {
  /** JWT token for authentication */
  token: string;
  /** Optional custom API URL (defaults to https://oauth.divine.video) */
  apiUrl?: string;
  /** Optional timeout for requests in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Nostr signer that uses JWT authentication to sign events via Keycast REST API
 *
 * This provides a window.nostr-compatible interface that signs events by making
 * HTTP requests to the Keycast server with JWT Bearer authentication.
 *
 * @example
 * ```typescript
 * const signer = new KeycastJWTSigner({ token: 'your-jwt-token' });
 * const pubkey = await signer.getPublicKey();
 * const signed = await signer.signEvent({ kind: 1, content: 'Hello!', tags: [], created_at: 0 });
 * ```
 */
export class KeycastJWTSigner implements NostrSigner {
  private token: string;
  private apiUrl: string;
  private timeout: number;
  private cachedPubkey: string | null = null;

  constructor(options: KeycastJWTSignerOptions) {
    this.token = options.token;
    this.apiUrl = options.apiUrl || KEYCAST_API_URL;
    this.timeout = options.timeout || 10000;
  }

  /**
   * Get the public key for the authenticated user
   * Caches the result after first call
   */
  async getPublicKey(): Promise<string> {
    if (this.cachedPubkey) {
      return this.cachedPubkey;
    }

    console.log('[KeycastJWTSigner] Fetching public key...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiUrl}/api/user/pubkey`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error || `Failed to get public key: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.pubkey || typeof data.pubkey !== 'string') {
        throw new Error('Invalid response: missing pubkey');
      }

      this.cachedPubkey = data.pubkey;
      console.log('[KeycastJWTSigner] ✅ Got public key:', data.pubkey);

      return data.pubkey;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: Failed to get public key');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sign an event via JWT-authenticated REST API
   */
  async signEvent(
    event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>
  ): Promise<NostrEvent> {
    console.log('[KeycastJWTSigner] Signing event kind', event.kind, '...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiUrl}/api/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ event }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to sign event: ${response.status}`);
      }

      const data = await response.json();

      if (!data.event || !data.event.id || !data.event.sig) {
        throw new Error('Invalid response: missing signed event');
      }

      console.log('[KeycastJWTSigner] ✅ Event signed:', data.event.id);

      return data.event;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: Failed to sign event');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get relay configuration (optional method)
   * Returns empty object as relays are not managed by JWT signer
   */
  async getRelays(): Promise<Record<string, { read: boolean; write: boolean }>> {
    console.log('[KeycastJWTSigner] getRelays() called, returning empty object');
    return {};
  }

  /**
   * NIP-04 encryption (not supported by JWT API yet)
   */
  readonly nip04 = {
    encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
      console.log('[KeycastJWTSigner] nip04.encrypt() called...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.apiUrl}/api/encrypt/nip04`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ pubkey, plaintext }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error || `NIP-04 encryption failed: ${response.status}`
          );
        }

        const data = await response.json();
        return data.ciphertext;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout: NIP-04 encryption failed');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },

    decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
      console.log('[KeycastJWTSigner] nip04.decrypt() called...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.apiUrl}/api/decrypt/nip04`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ pubkey, ciphertext }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error || `NIP-04 decryption failed: ${response.status}`
          );
        }

        const data = await response.json();
        return data.plaintext;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout: NIP-04 decryption failed');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };

  /**
   * NIP-44 encryption (not supported by JWT API yet)
   */
  readonly nip44 = {
    encrypt: async (pubkey: string, plaintext: string): Promise<string> => {
      console.log('[KeycastJWTSigner] nip44.encrypt() called...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.apiUrl}/api/encrypt/nip44`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ pubkey, plaintext }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error || `NIP-44 encryption failed: ${response.status}`
          );
        }

        const data = await response.json();
        return data.ciphertext;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout: NIP-44 encryption failed');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },

    decrypt: async (pubkey: string, ciphertext: string): Promise<string> => {
      console.log('[KeycastJWTSigner] nip44.decrypt() called...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.apiUrl}/api/decrypt/nip44`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ pubkey, ciphertext }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error || `NIP-44 decryption failed: ${response.status}`
          );
        }

        const data = await response.json();
        return data.plaintext;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout: NIP-44 decryption failed');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };

  /**
   * Update the JWT token (useful when token is refreshed)
   */
  updateToken(newToken: string): void {
    this.token = newToken;
    // Clear cached pubkey as it might have changed
    this.cachedPubkey = null;
    console.log('[KeycastJWTSigner] Token updated');
  }
}
