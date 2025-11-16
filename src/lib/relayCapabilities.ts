// ABOUTME: Relay capability detection for NIP-50 search and other features
// ABOUTME: Provides graceful fallback when relays don't support advanced features

import type { SortMode } from '@/types/nostr';

export interface RelayCapabilities {
  url: string;
  supportsNIP50: boolean;
  supportedSortModes: SortMode[];
  supportsSearch: boolean;
  detectedAt: number;
  error?: string;
}

// Cache relay capabilities (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const capabilitiesCache = new Map<string, RelayCapabilities>();

/**
 * Test if relay supports NIP-50 search by sending a test query
 */
async function testNIP50Support(relayUrl: string): Promise<boolean> {
  try {
    // We'll use the Nostr client to test this
    // For now, assume relay.divine.video and similar support it
    // This is a placeholder - full implementation would actually query the relay
    
    // Known relays with NIP-50 support
    const knownNIP50Relays = [
      'wss://relay.divine.video',
      'wss://relay.nostr.band',
      'wss://relay.nostr.wine',
    ];
    
    return knownNIP50Relays.some(known => relayUrl.includes(known.replace('wss://', '')));
  } catch {
    return false;
  }
}

/**
 * Detect relay capabilities
 */
export async function detectRelayCapabilities(relayUrl: string): Promise<RelayCapabilities> {
  // Check cache first
  const cached = capabilitiesCache.get(relayUrl);
  if (cached && Date.now() - cached.detectedAt < CACHE_DURATION) {
    return cached;
  }

  try {
    // Test NIP-50 support
    const supportsNIP50 = await testNIP50Support(relayUrl);

    const capabilities: RelayCapabilities = {
      url: relayUrl,
      supportsNIP50,
      supportedSortModes: supportsNIP50 ? ['hot', 'top', 'rising', 'controversial'] : [],
      supportsSearch: supportsNIP50,
      detectedAt: Date.now(),
    };

    // Cache the result
    capabilitiesCache.set(relayUrl, capabilities);

    return capabilities;
  } catch (error) {
    const fallbackCapabilities: RelayCapabilities = {
      url: relayUrl,
      supportsNIP50: false,
      supportedSortModes: [],
      supportsSearch: false,
      detectedAt: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    capabilitiesCache.set(relayUrl, fallbackCapabilities);
    return fallbackCapabilities;
  }
}

/**
 * Get cached capabilities or detect them
 */
export function getRelayCapabilities(relayUrl: string): RelayCapabilities | null {
  const cached = capabilitiesCache.get(relayUrl);
  if (cached && Date.now() - cached.detectedAt < CACHE_DURATION) {
    return cached;
  }
  return null;
}

/**
 * Clear capabilities cache (useful for testing or relay changes)
 */
export function clearCapabilitiesCache(relayUrl?: string) {
  if (relayUrl) {
    capabilitiesCache.delete(relayUrl);
  } else {
    capabilitiesCache.clear();
  }
}

/**
 * Hook-compatible capability checker
 */
export function shouldUseNIP50(relayUrl: string): boolean {
  const capabilities = getRelayCapabilities(relayUrl);
  
  // If we don't have cached capabilities yet, optimistically assume support for known relays
  if (!capabilities) {
    const knownNIP50Relays = [
      'relay.divine.video',
      'relay.nostr.band',
      'relay.nostr.wine',
    ];
    return knownNIP50Relays.some(known => relayUrl.includes(known));
  }
  
  return capabilities.supportsNIP50;
}

/**
 * Get effective sort mode based on relay capabilities
 * Returns undefined if relay doesn't support NIP-50
 */
export function getEffectiveSortMode(
  relayUrl: string,
  requestedMode: SortMode
): SortMode | undefined {
  const capabilities = getRelayCapabilities(relayUrl);
  
  if (!capabilities || !capabilities.supportsNIP50) {
    // Optimistically try for known relays
    if (shouldUseNIP50(relayUrl)) {
      return requestedMode;
    }
    return undefined;
  }
  
  if (capabilities.supportedSortModes.includes(requestedMode)) {
    return requestedMode;
  }
  
  // Fallback to 'hot' if requested mode not supported
  return capabilities.supportedSortModes.includes('hot') ? 'hot' : undefined;
}
