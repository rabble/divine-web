import { useNostr } from "@nostrify/react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { useCurrentUser } from "./useCurrentUser";
import { useLoginDialog } from "@/contexts/LoginDialogContext";

import type { NostrEvent } from "@nostrify/nostrify";

export function useNostrPublish(): UseMutationResult<NostrEvent> {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { openLoginDialog } = useLoginDialog();

  return useMutation({
    mutationFn: async (t: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => {
      if (!user) {
        // Open login dialog and prevent mutation from continuing
        openLoginDialog();
        // Return a rejected promise that won't be logged/toasted
        // We use ABORT_ERR which is typically handled silently
        return Promise.reject(new DOMException('Login required', 'AbortError'));
      }

      const tags = t.tags ?? [];

      // Add the client tag if it doesn't exist
      if (location.protocol === "https:" && !tags.some(([name]) => name === "client")) {
        tags.push(["client", location.hostname]);
      }

      const event = await user.signer.signEvent({
        kind: t.kind,
        content: t.content ?? "",
        tags,
        created_at: t.created_at ?? Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(5000) });
      return event;
    },
    onError: (error) => {
      // Silently ignore AbortError (login required) - we've already shown the login dialog
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error("Failed to publish event:", error);
    },
    onSuccess: (data) => {
      console.log("Event published successfully:", data);
    },
    // Disable react-query's automatic error retry for abort errors
    retry: (failureCount, error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 3;
    },
  });
}