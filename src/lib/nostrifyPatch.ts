// ABOUTME: Monkeypatch for Nostrify to preserve custom relay parameters like 'sort'
// ABOUTME: This allows relay-native sorting to work with relay.divine.video

import { NRelay1 } from '@nostrify/nostrify';

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
  // @ts-ignore - Patching global WebSocket
  globalThis.WebSocket = class PatchedWebSocket extends OriginalWebSocket {
    private _customFilters = new Map<string, any[]>();

    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);

      // Patch send to intercept REQ messages
      const originalSend = this.send.bind(this);
      this.send = (data: any) => {
        try {
          if (typeof data === 'string') {
            const message = JSON.parse(data);

            // Check if this is a REQ message and we have custom filters stored
            if (Array.isArray(message) && message[0] === 'REQ') {
              const [, subId, ...messageFilters] = message;
              const customFilters = this._customFilters.get(subId);

              if (customFilters && customFilters.length > 0) {
                // Add back custom params to each filter
                const patchedFilters = messageFilters.map((mf: any, index: number) => {
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
        } catch (e) {
          // If parsing fails, send original data
        }

        return originalSend(data);
      };
    }

    // Method for Nostrify to register custom filters
    _registerCustomFilters(subId: string, filters: any[]) {
      this._customFilters.set(subId, filters);
    }
  };

  // Patch NRelay1.prototype.req to capture custom filter params
  const originalReq = (NRelay1.prototype as any).req;

  (NRelay1.prototype as any).req = function(filters: any[], opts?: any) {
    // Extract custom params from filters before Nostrify strips them
    const customFilters = filters.map(filter => {
      const customParams: Record<string, any> = {};

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
      if (typeof (this.socket as any)._registerCustomFilters === 'function') {
        (this.socket as any)._registerCustomFilters(subId, customFilters);
      }
    }

    return result;
  };

  console.log('[NostrifyPatch] Nostrify patched to preserve custom filter parameters');
}
