// ABOUTME: Page component for browsing and discovering video lists
// ABOUTME: Shows user's lists, trending lists, and allows list creation

import { useState } from 'react';
import { useVideoLists, useTrendingVideoLists } from '@/hooks/useVideoLists';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { List, TrendingUp, Plus, Users, Video, Clock } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { CreateListDialog } from '@/components/CreateListDialog';
import { formatDistanceToNow } from 'date-fns';

function ListCard({ list }: { list: any }) {
  const author = useAuthor(list.pubkey);
  const authorMetadata = author.data?.metadata;
  const authorName = authorMetadata?.name || genUserName(list.pubkey);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link 
                to={`/list/${list.pubkey}/${list.id}`}
                className="hover:text-primary transition-colors"
              >
                {list.name}
              </Link>
            </CardTitle>
            {list.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {list.description}
              </CardDescription>
            )}
          </div>
          {list.image && (
            <img
              src={list.image}
              alt={list.name}
              className="w-16 h-16 rounded object-cover ml-4"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Author */}
          <Link 
            to={`/profile/${list.pubkey}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorMetadata?.picture} />
              <AvatarFallback>{authorName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{authorName}</span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span>{list.videoCoordinates.length} videos</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDistanceToNow(list.createdAt * 1000, { addSuffix: true })}</span>
            </div>
          </div>

          {/* View Button */}
          <Link to={`/list/${list.pubkey}/${list.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              View List
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ListsPage() {
  const { user } = useCurrentUser();
  const { data: userLists, isLoading: userListsLoading } = useVideoLists(user?.pubkey);
  const { data: trendingLists, isLoading: trendingLoading } = useTrendingVideoLists();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <List className="h-8 w-8" />
            Video Lists
          </h1>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Discover curated collections of videos from the community
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={user ? 'my-lists' : 'trending'} className="space-y-6">
        <TabsList>
          {user && (
            <TabsTrigger value="my-lists">
              <List className="h-4 w-4 mr-2" />
              My Lists
            </TabsTrigger>
          )}
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Users className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
        </TabsList>

        {/* My Lists Tab */}
        {user && (
          <TabsContent value="my-lists" className="space-y-6">
            {userListsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userLists && userLists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userLists.map((list) => (
                  <ListCard key={`${list.pubkey}-${list.id}`} list={list} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    You haven't created any lists yet
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First List
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          {trendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : trendingLists && trendingLists.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Most popular lists from the past week</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingLists.map((list) => (
                  <ListCard key={`${list.pubkey}-${list.id}`} list={list} />
                ))}
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No trending lists found
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Discover lists from creators you follow
            </p>
            <p className="text-sm text-muted-foreground">
              Coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create List Dialog */}
      {showCreateDialog && (
        <CreateListDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}