// ABOUTME: Hook for managing follow relationships using kind 3 contact lists
// ABOUTME: Handles following/unfollowing users and querying follow status

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { NostrEvent } from '@nostrify/nostrify';

interface FollowRelationshipData {
  isFollowing: boolean;
  mutualFollows: number;
  contactListEvent: NostrEvent | null;
}

interface FollowUserParams {
  targetPubkey: string;
  currentContactList: NostrEvent | null;
  targetDisplayName?: string;
}

interface UnfollowUserParams {
  targetPubkey: string;
  currentContactList: NostrEvent | null;
}

/**
 * Check if current user follows a target user and get relationship details
 */
export function useFollowRelationship(targetPubkey: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<FollowRelationshipData>({
    queryKey: ['follow-relationship', user?.pubkey, targetPubkey],
    queryFn: async (context) => {
      if (!user?.pubkey || !targetPubkey) {
        return {
          isFollowing: false,
          mutualFollows: 0,
          contactListEvent: null,
        };
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(3000)]);

      try {
        // Optimized: Single batched query for both contact lists
        const allContactLists = await nostr.query([
          {
            kinds: [3],
            authors: [user.pubkey],
            limit: 1,
          },
          {
            kinds: [3],
            authors: [targetPubkey],
            limit: 1,
          }
        ], { signal });

        // Separate and find latest for each user
        const currentUserLists = allContactLists.filter(e => e.pubkey === user.pubkey);
        const targetUserLists = allContactLists.filter(e => e.pubkey === targetPubkey);

        const currentContactListEvent = currentUserLists
          .sort((a, b) => b.created_at - a.created_at)[0] || null;

        const targetContactListEvent = targetUserLists
          .sort((a, b) => b.created_at - a.created_at)[0] || null;

        // Check if current user follows target
        const isFollowing = currentContactListEvent
          ? currentContactListEvent.tags.some(tag => tag[0] === 'p' && tag[1] === targetPubkey)
          : false;

        // Calculate mutual follows
        let mutualFollows = 0;
        if (currentContactListEvent && targetContactListEvent) {
          const currentFollowing = new Set(
            currentContactListEvent.tags
              .filter(tag => tag[0] === 'p')
              .map(tag => tag[1])
          );

          const targetFollowing = new Set(
            targetContactListEvent.tags
              .filter(tag => tag[0] === 'p')
              .map(tag => tag[1])
          );

          mutualFollows = [...currentFollowing].filter(pubkey => targetFollowing.has(pubkey)).length;
        }

        return {
          isFollowing,
          mutualFollows,
          contactListEvent: currentContactListEvent,
        };
      } catch (error) {
        console.error('Failed to fetch follow relationship:', error);
        return {
          isFollowing: false,
          mutualFollows: 0,
          contactListEvent: null,
        };
      }
    },
    enabled: !!user?.pubkey && !!targetPubkey,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

/**
 * Follow a user by updating the contact list (kind 3)
 */
export function useFollowUser() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ targetPubkey, currentContactList, targetDisplayName }: FollowUserParams) => {
      if (!user?.pubkey) throw new Error('No current user');

      // Get current contact list tags or start with empty array
      const currentTags = currentContactList?.tags || [];

      // Check if already following (shouldn't happen but good safety check)
      const alreadyFollowing = currentTags.some(tag => tag[0] === 'p' && tag[1] === targetPubkey);
      if (alreadyFollowing) {
        throw new Error('Already following this user');
      }

      // Add new follow tag
      // Format: ['p', pubkey, relayUrl, petname]
      const newFollowTag = ['p', targetPubkey, '', targetDisplayName || ''];
      const updatedTags = [...currentTags, newFollowTag];

      // Preserve relay information from existing contact list or use default
      const relayContent = currentContactList?.content || JSON.stringify({
        'wss://relay.divine.video': { read: true, write: true },
      });

      // Create new contact list event
      return await publishEvent({
        kind: 3,
        content: relayContent,
        tags: updatedTags,
      });
    },
    onSuccess: (_, { targetPubkey }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['follow-relationship', user?.pubkey, targetPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ['profile-stats', targetPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ['profile-stats', user?.pubkey],
      });
    },
  });
}

/**
 * Unfollow a user by removing them from the contact list
 */
export function useUnfollowUser() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ targetPubkey, currentContactList }: UnfollowUserParams) => {
      if (!user?.pubkey) throw new Error('No current user');
      if (!currentContactList) throw new Error('No contact list to update');

      // Remove the target user from tags
      const updatedTags = currentContactList.tags.filter(tag =>
        !(tag[0] === 'p' && tag[1] === targetPubkey)
      );

      // Create new contact list event with removed user
      return await publishEvent({
        kind: 3,
        content: currentContactList.content,
        tags: updatedTags,
      });
    },
    onSuccess: (_, { targetPubkey }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['follow-relationship', user?.pubkey, targetPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ['profile-stats', targetPubkey],
      });
      queryClient.invalidateQueries({
        queryKey: ['profile-stats', user?.pubkey],
      });
    },
  });
}