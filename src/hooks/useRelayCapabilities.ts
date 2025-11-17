// ABOUTME: React hook for detecting and using relay capabilities
// ABOUTME: Provides graceful fallback when relays don't support NIP-50

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { detectRelayCapabilities, shouldUseNIP50, getEffectiveSortMode, type RelayCapabilities } from '@/lib/relayCapabilities';
import type { SortMode } from '@/types/nostr';

/**
 * Hook to detect relay capabilities
 */
export function useRelayCapabilities(relayUrl?: string) {
  const { config } = useAppContext();
  const effectiveRelayUrl = relayUrl || config.relayUrl;

  return useQuery<RelayCapabilities>({
    queryKey: ['relay-capabilities', effectiveRelayUrl],
    queryFn: () => detectRelayCapabilities(effectiveRelayUrl),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

/**
 * Hook to check if current relay supports NIP-50
 */
export function useNIP50Support(relayUrl?: string): boolean {
  const { config } = useAppContext();
  const effectiveRelayUrl = relayUrl || config.relayUrl;
  const { data } = useRelayCapabilities(effectiveRelayUrl);

  // Optimistic: assume support while detecting
  if (!data) {
    return shouldUseNIP50(effectiveRelayUrl);
  }

  return data.supportsNIP50;
}

/**
 * Hook to get effective sort mode with fallback
 */
export function useEffectiveSortMode(
  requestedMode: SortMode,
  relayUrl?: string
): SortMode | undefined {
  const { config } = useAppContext();
  const effectiveRelayUrl = relayUrl || config.relayUrl;
  const supportsNIP50 = useNIP50Support(effectiveRelayUrl);

  // If relay doesn't support NIP-50, return undefined (triggers client-side sorting)
  if (!supportsNIP50) {
    return undefined;
  }

  return getEffectiveSortMode(effectiveRelayUrl, requestedMode) || requestedMode;
}
