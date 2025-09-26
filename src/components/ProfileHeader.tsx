// ABOUTME: Profile header component showing user avatar, bio, stats, and follow button
// ABOUTME: Displays user metadata, social stats, and follow/unfollow functionality

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, UserCheck, CheckCircle } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { getSafeProfileImage } from '@/lib/imageUtils';
import type { NostrMetadata } from '@nostrify/nostrify';

export interface ProfileStats {
  videosCount: number;
  totalViews: number;
  joinedDate: Date | null;
  followersCount: number;
  followingCount: number;
}

interface ProfileHeaderProps {
  pubkey: string;
  metadata?: NostrMetadata;
  stats?: ProfileStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: (shouldFollow: boolean) => void;
  isLoading?: boolean;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
  }
  return num.toString();
}

function formatJoinedDate(date: Date | null): string {
  if (!date) return 'Recently joined';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
  };
  
  return `Joined ${date.toLocaleDateString('en-US', options)}`;
}

export function ProfileHeader({
  pubkey,
  metadata,
  stats,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  isLoading: _isLoading = false,
  className,
}: ProfileHeaderProps) {
  // Metadata is now guaranteed to have values from generateProfile.ts
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const userName = metadata?.name || genUserName(pubkey);
  const profileImage = getSafeProfileImage(metadata?.picture) || `https://api.dicebear.com/7.x/identicon/svg?seed=${pubkey}`;
  const about = metadata?.about;
  const nip05 = metadata?.nip05;
  const website = metadata?.website;

  const handleFollowClick = () => {
    onFollowToggle(!isFollowing);
  };

  return (
    <div
      className={`space-y-4 ${className || ''}`}
      data-testid="profile-header"
    >
      {/* Main Profile Section */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0 self-center sm:self-start">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24" data-testid="profile-avatar">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="text-lg">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="space-y-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold truncate">
                {displayName}
              </h1>
              {nip05 ? (
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <p className="text-muted-foreground text-sm font-medium">{nip05}</p>
                </div>
              ) : userName !== displayName ? (
                <p className="text-muted-foreground text-sm">@{userName}</p>
              ) : null}
            </div>

            {/* Website */}
            {website && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="text-xs">
                  <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {website.includes('vine.co') ? 'Original Vine Profile' : 'Website'}
                  </a>
                </Badge>
              </div>
            )}

            {/* Bio */}
            {about && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {about}
              </p>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && (
          <div className="flex-shrink-0 self-center sm:self-start">
            <Button
              onClick={handleFollowClick}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className="min-w-[100px]"
              data-testid="follow-button"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-t"
        data-testid="profile-stats"
      >
        {/* Videos Count */}
        <div className="text-center">
          {stats ? (
            <>
              <div className="text-xl sm:text-2xl font-bold">
                {formatNumber(stats.videosCount)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Videos</div>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-12 mx-auto mb-1" data-testid="stat-skeleton-videos" />
              <div className="text-xs sm:text-sm text-muted-foreground">Videos</div>
            </>
          )}
        </div>

        {/* Followers Count */}
        <div className="text-center">
          {stats ? (
            <>
              <div className="text-xl sm:text-2xl font-bold">
                {formatNumber(stats.followersCount)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-12 mx-auto mb-1" data-testid="stat-skeleton-followers" />
              <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
            </>
          )}
        </div>

        {/* Following Count */}
        <div className="text-center">
          {stats ? (
            <>
              <div className="text-xl sm:text-2xl font-bold">
                {formatNumber(stats.followingCount)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-12 mx-auto mb-1" data-testid="stat-skeleton-following" />
              <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
            </>
          )}
        </div>

        {/* Total Views */}
        <div className="text-center">
          {stats ? (
            <>
              <div className="text-xl sm:text-2xl font-bold">
                {formatNumber(stats.totalViews)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Views</div>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-12 mx-auto mb-1" data-testid="stat-skeleton-views" />
              <div className="text-xs sm:text-sm text-muted-foreground">Total Views</div>
            </>
          )}
        </div>

        {/* Joined Date */}
        <div className="text-center col-span-2 sm:col-span-1">
          {stats ? (
            <>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {formatJoinedDate(stats.joinedDate)}
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-20 mx-auto" data-testid="stat-skeleton-joined" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}