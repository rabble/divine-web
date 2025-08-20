// ABOUTME: Utility functions for profile URL generation and NIP-05 handling
// ABOUTME: Generates clean URLs using NIP-05 identifiers when available

import { nip19 } from 'nostr-tools';
import type { NostrMetadata } from '@nostrify/nostrify';

/**
 * Generate the appropriate profile URL for a user
 * Uses NIP-05 format (/u/user@domain.com) when available,
 * otherwise falls back to npub format
 */
export function getProfileUrl(pubkey: string, metadata?: NostrMetadata): string {
  // Check if the user has a NIP-05 identifier
  if (metadata?.nip05) {
    // Encode the NIP-05 identifier for use in URL
    const encodedNip05 = encodeURIComponent(metadata.nip05);
    return `/u/${encodedNip05}`;
  }
  
  // Fallback to npub format
  const npub = nip19.npubEncode(pubkey);
  return `/${npub}`;
}

/**
 * Extract username from NIP-05 identifier
 * e.g., "alice@example.com" returns "alice"
 */
export function getNip05Username(nip05: string): string {
  const parts = nip05.split('@');
  return parts[0] || nip05;
}

/**
 * Extract domain from NIP-05 identifier
 * e.g., "alice@example.com" returns "example.com"
 */
export function getNip05Domain(nip05: string): string {
  const parts = nip05.split('@');
  return parts[1] || '';
}

/**
 * Format NIP-05 for display (may truncate long domains)
 */
export function formatNip05Display(nip05: string, maxLength: number = 30): string {
  if (nip05.length <= maxLength) {
    return nip05;
  }
  
  const [username, domain] = nip05.split('@');
  if (!domain) return nip05;
  
  // If username is already long, just truncate the whole thing
  if (username.length > 15) {
    return nip05.substring(0, maxLength - 3) + '...';
  }
  
  // Otherwise, truncate the domain
  const maxDomainLength = maxLength - username.length - 1; // -1 for @
  if (domain.length > maxDomainLength) {
    return `${username}@${domain.substring(0, maxDomainLength - 3)}...`;
  }
  
  return nip05;
}