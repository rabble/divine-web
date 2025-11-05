// ABOUTME: Monkeypatch for Nostrify to preserve custom relay parameters like 'sort'
// ABOUTME: This allows relay-native sorting to work with relay.divine.video

import { NRelay1, NostrFilter } from '@nostrify/nostrify';

/**
 * Patches NRelay1 to preserve custom filter parameters that are not part of NIP-01 standard.
 *
 * Nostrify strips out non-standard filter fields before sending to the relay.
 * This patch intercepts the WebSocket send operation and adds back custom fields
 * like 'sort' that relay.divine.video supports.
 */
export function patchNostrifyForCustomParams() {
  // Store the original WebSocket constructor
  const OriginalWebSocket = globalThis.WebSocket;

  // Create a patched WebSocket that preserves custom params
  globalThis.WebSocket = class PatchedWebSocket extends OriginalWebSocket {
    private _customFilters = new Map<string, Record<string, unknown>[]>();

    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);

      // Patch send to intercept REQ messages
      const originalSend = this.send.bind(this);
      this.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        try {
          if (typeof data === 'string') {
            const message = JSON.parse(data);

            // Check if this is a REQ message and we have custom filters stored
            if (Array.isArray(message) && message[0] === 'REQ') {
              const [, subId, ...messageFilters] = message;
              const customFilters = this._customFilters.get(subId);

              if (customFilters && customFilters.length > 0) {
                // Add back custom params to each filter
                const patchedFilters = messageFilters.map((mf: Record<string, unknown>, index: number) => {
                  return { ...mf, ...customFilters[index] };
                });

                // Reconstruct message with custom params
                const patchedMessage = ['REQ', subId, ...patchedFilters];
                data = JSON.stringify(patchedMessage);

                console.log('[NostrifyPatch] Restored custom params to REQ');
                this._customFilters.delete(subId); // Clean up
              }
            }
          }
        } catch {
          // If parsing fails, send original data
        }

        return originalSend(data);
      };
    }

    // Method for Nostrify to register custom filters
    _registerCustomFilters(subId: string, filters: Record<string, unknown>[]) {
      this._customFilters.set(subId, filters);
    }
  };

  // Patch NRelay1.prototype.req to capture custom filter params
  const originalReq = (NRelay1.prototype as unknown as Record<string, unknown>).req as (...args: unknown[]) => unknown;

  (NRelay1.prototype as unknown as Record<string, unknown>).req = function(filters: NostrFilter[], opts?: { signal?: AbortSignal }) {
    // Extract custom params from filters before Nostrify strips them
    const customFilters = filters.map(filter => {
      const customParams: Record<string, unknown> = {};

      // Known custom parameters to preserve
      const customFields = ['sort'];

      for (const field of customFields) {
        if (filter[field] !== undefined) {
          customParams[field] = filter[field];
        }
      }

      return customParams;
    });

    // Call original req method
    const result = originalReq.call(this, filters, opts);

    // Register custom filters with the WebSocket
    if (this.socket && customFilters.some(f => Object.keys(f).length > 0)) {
      // Generate a subscription ID to track this request
      const subId = result; // The req method returns the subscription ID
      const socket = this.socket as { _registerCustomFilters?: (id: string, filters: Record<string, unknown>[]) => void };
      if (typeof socket._registerCustomFilters === 'function') {
        socket._registerCustomFilters(subId as string, customFilters);
      }
    }

    return result;
  };

  console.log('[NostrifyPatch] Nostrify patched to preserve custom filter parameters');
}
