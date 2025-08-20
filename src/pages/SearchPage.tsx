// ABOUTME: Comprehensive search page with debounced input, filter tabs, and results display
// ABOUTME: Supports searching videos, users, hashtags with proper loading and empty states

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Search, Hash, Users, Video, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RelaySelector } from '@/components/RelaySelector';
import { VideoCard } from '@/components/VideoCard';
import { useSearchVideos } from '@/hooks/useSearchVideos';
import { useSearchUsers } from '@/hooks/useSearchUsers';
import { useSearchHashtags } from '@/hooks/useSearchHashtags';
import { genUserName } from '@/lib/genUserName';

type SearchFilter = 'all' | 'videos' | 'users' | 'hashtags';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>(
    (searchParams.get('filter') as SearchFilter) || 'all'
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search hooks
  const {
    data: videoResults = [],
    isLoading: isLoadingVideos,
    error: videoError,
  } = useSearchVideos({
    query: searchQuery,
    limit: 20,
  });

  const {
    data: userResults = [],
    isLoading: isLoadingUsers,
    error: userError,
  } = useSearchUsers({
    query: searchQuery,
    limit: 20,
  });

  const {
    data: hashtagResults = [],
    isLoading: isLoadingHashtags,
    error: hashtagError,
  } = useSearchHashtags({
    query: searchQuery,
    limit: 20,
  });

  // Popular hashtags for suggestions
  const {
    data: popularHashtags = [],
  } = useSearchHashtags({
    query: '',
    limit: 10,
  });

  useSeoMeta({
    title: searchQuery ? `Search: ${searchQuery} - Divine Web` : 'Search - Divine Web',
    description: 'Search for videos, users, and hashtags on Divine Web',
  });

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (activeFilter !== 'all') params.set('filter', activeFilter);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeFilter, setSearchParams]);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
  };

  // Handle hashtag suggestion click
  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(`#${hashtag}`);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Handle filter tab change
  const handleFilterChange = (filter: SearchFilter) => {
    setActiveFilter(filter);
  };

  // Loading state based on active filter
  const isLoading = (() => {
    switch (activeFilter) {
      case 'videos':
        return isLoadingVideos;
      case 'users':
        return isLoadingUsers;
      case 'hashtags':
        return isLoadingHashtags;
      default:
        return isLoadingVideos || isLoadingUsers || isLoadingHashtags;
    }
  })();

  // Error state based on active filter
  const error = (() => {
    switch (activeFilter) {
      case 'videos':
        return videoError;
      case 'users':
        return userError;
      case 'hashtags':
        return hashtagError;
      default:
        return videoError || userError || hashtagError;
    }
  })();

  // Results count based on active filter
  const getResultsCount = () => {
    switch (activeFilter) {
      case 'videos':
        return videoResults.length;
      case 'users':
        return userResults.length;
      case 'hashtags':
        return hashtagResults.length;
      default:
        return videoResults.length + userResults.length + hashtagResults.length;
    }
  };

  // Check if we have any results
  const hasResults = videoResults.length > 0 || userResults.length > 0 || hashtagResults.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="container py-6">
        {/* Search bar */}
        <div className="mb-6 flex-1 max-w-2xl mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for videos, users, or hashtags..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(!searchQuery.trim())}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4"
              autoFocus
            />
          </div>

          {/* Search suggestions dropdown */}
          {showSuggestions && popularHashtags.length > 0 && (
            <Card className="absolute top-full mt-1 w-full z-50 max-h-64 overflow-y-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Popular Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {popularHashtags.slice(0, 8).map((hashtag) => (
                    <Button
                      key={hashtag.tag}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHashtagClick(hashtag.tag)}
                      className="h-auto px-2 py-1 text-xs"
                    >
                      #{hashtag.tag}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search tabs */}
        <Tabs value={activeFilter} onValueChange={handleFilterChange} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="gap-2">
              <Hash className="h-4 w-4" />
              <span className="hidden sm:inline">Hashtags</span>
            </TabsTrigger>
          </TabsList>

          {/* Results count */}
          {searchQuery.trim() && (
            <div className="text-center mb-4">
              {isLoading ? (
                <p className="text-muted-foreground">Searching...</p>
              ) : error ? (
                <p className="text-destructive">Search error occurred</p>
              ) : (
                <p className="text-muted-foreground">
                  {getResultsCount() === 0
                    ? 'No results found'
                    : `${getResultsCount()} ${
                        activeFilter === 'all'
                          ? 'results'
                          : activeFilter === 'videos'
                          ? 'videos'
                          : activeFilter === 'users'
                          ? 'users'
                          : 'hashtags'
                      } found`}
                </p>
              )}
            </div>
          )}

          {/* All results tab */}
          <TabsContent value="all" className="mt-0">
            {!searchQuery.trim() ? (
              <EmptySearchState />
            ) : isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState />
            ) : !hasResults ? (
              <NoResultsState />
            ) : (
              <div className="space-y-8">
                {/* Videos section */}
                {videoResults.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Videos ({videoResults.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {videoResults.slice(0, 6).map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                    {videoResults.length > 6 && (
                      <div className="text-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveFilter('videos')}
                        >
                          View all {videoResults.length} videos
                        </Button>
                      </div>
                    )}
                  </section>
                )}

                {/* Users section */}
                {userResults.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users ({userResults.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {userResults.slice(0, 6).map((user) => (
                        <UserCard key={user.pubkey} user={user} />
                      ))}
                    </div>
                    {userResults.length > 6 && (
                      <div className="text-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveFilter('users')}
                        >
                          View all {userResults.length} users
                        </Button>
                      </div>
                    )}
                  </section>
                )}

                {/* Hashtags section */}
                {hashtagResults.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Hashtags ({hashtagResults.length})
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {hashtagResults.slice(0, 12).map((hashtag) => (
                        <HashtagCard
                          key={hashtag.tag}
                          hashtag={hashtag}
                          onClick={() => handleHashtagClick(hashtag.tag)}
                        />
                      ))}
                    </div>
                    {hashtagResults.length > 12 && (
                      <div className="text-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveFilter('hashtags')}
                        >
                          View all {hashtagResults.length} hashtags
                        </Button>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </TabsContent>

          {/* Videos only tab */}
          <TabsContent value="videos" className="mt-0">
            {!searchQuery.trim() ? (
              <EmptySearchState />
            ) : isLoadingVideos ? (
              <LoadingState />
            ) : videoError ? (
              <ErrorState />
            ) : videoResults.length === 0 ? (
              <NoResultsState />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videoResults.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users only tab */}
          <TabsContent value="users" className="mt-0">
            {!searchQuery.trim() ? (
              <EmptySearchState />
            ) : isLoadingUsers ? (
              <LoadingState />
            ) : userError ? (
              <ErrorState />
            ) : userResults.length === 0 ? (
              <NoResultsState />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userResults.map((user) => (
                  <UserCard key={user.pubkey} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hashtags only tab */}
          <TabsContent value="hashtags" className="mt-0">
            {!searchQuery.trim() ? (
              <EmptySearchState />
            ) : isLoadingHashtags ? (
              <LoadingState />
            ) : hashtagError ? (
              <ErrorState />
            ) : hashtagResults.length === 0 ? (
              <NoResultsState />
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtagResults.map((hashtag) => (
                  <HashtagCard
                    key={hashtag.tag}
                    hashtag={hashtag}
                    onClick={() => handleHashtagClick(hashtag.tag)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// User card component
function UserCard({ user }: { user: { pubkey: string; metadata?: any } }) {
  const displayName = user.metadata?.display_name || user.metadata?.name || genUserName(user.pubkey);
  const username = user.metadata?.name || genUserName(user.pubkey);
  const about = user.metadata?.about;
  const picture = user.metadata?.picture;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={picture} alt={displayName} />
            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{displayName}</h3>
            <p className="text-sm text-muted-foreground truncate">@{username}</p>
            {about && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {about}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hashtag card component
function HashtagCard({ 
  hashtag, 
  onClick 
}: { 
  hashtag: { tag: string; count: number };
  onClick: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="cursor-pointer hover:bg-secondary/80 px-3 py-1"
      onClick={onClick}
    >
      #{hashtag.tag}
      <span className="ml-2 text-xs opacity-70">{hashtag.count} videos</span>
    </Badge>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Empty search state
function EmptySearchState() {
  return (
    <div className="text-center py-12">
      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Search Divine Web</h3>
      <p className="text-muted-foreground mb-4">
        Find videos, users, and hashtags across the Nostr network
      </p>
      <p className="text-sm text-muted-foreground">
        Try searching for #dance, #music, or any creator's name
      </p>
    </div>
  );
}

// No results state
function NoResultsState() {
  return (
    <div className="col-span-full">
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <Search className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                Try different keywords or check another relay
              </p>
            </div>
            <RelaySelector className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error state
function ErrorState() {
  return (
    <div className="col-span-full">
      <Card className="border-destructive/50">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="text-destructive">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search Error</h3>
              <p className="text-sm">
                Something went wrong while searching. Please try again.
              </p>
            </div>
            <RelaySelector className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SearchPage;
