// ABOUTME: Type declarations for window.nostr extension
// ABOUTME: Allows TypeScript to recognize window.nostr property

import type { NostrSigner } from '@nostrify/nostrify';

declare global {
  interface Window {
    nostr?: NostrSigner;
    zE?: (command: string, action: string) => void;
  }
}

export {};
