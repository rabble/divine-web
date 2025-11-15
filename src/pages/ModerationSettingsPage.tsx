// ABOUTME: Settings page for content moderation
// ABOUTME: Manage mute lists, view report history, and configure filtering

import { useState } from 'react';
import { useMuteList, useMuteItem, useUnmuteItem, useReportHistory } from '@/hooks/useModeration';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Shield, 
  UserX, 
  Hash, 
  Type, 
  FileText, 
  Plus, 
  Trash2, 
  Flag,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { MuteType, REPORT_REASON_LABELS } from '@/types/moderation';
import { genUserName } from '@/lib/genUserName';
import { getSafeProfileImage } from '@/lib/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';

function MutedUserItem({ pubkey, reason, onUnmute }: { 
  pubkey: string; 
  reason?: string;
  onUnmute: () => void;
}) {
  const author = useAuthor(pubkey);
  const authorMetadata = author.data?.metadata;
  const authorName = authorMetadata?.name || genUserName(pubkey);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getSafeProfileImage(authorMetadata?.picture)} />
          <AvatarFallback>{authorName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{authorName}</p>
          {reason && (
            <p className="text-xs text-muted-foreground">{reason}</p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUnmute}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Unmute
      </Button>
    </div>
  );
}

export default function ModerationSettingsPage() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { data: muteList = [], isLoading: muteListLoading } = useMuteList();
  const { data: reportHistory = [] } = useReportHistory();
  const muteItem = useMuteItem();
  const unmuteItem = useUnmuteItem();

  const [muteType, setMuteType] = useState<MuteType>(MuteType.USER);
  const [muteValue, setMuteValue] = useState('');
  const [muteReason, setMuteReason] = useState('');

  const mutedUsers = muteList.filter(item => item.type === MuteType.USER);
  const mutedHashtags = muteList.filter(item => item.type === MuteType.HASHTAG);
  const mutedKeywords = muteList.filter(item => item.type === MuteType.KEYWORD);

  const handleMute = async () => {
    if (!muteValue.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a value to mute',
        variant: 'destructive',
      });
      return;
    }

    try {
      let value = muteValue.trim();
      
      // Handle npub conversion for users
      if (muteType === MuteType.USER) {
        try {
          if (value.startsWith('npub')) {
            const decoded = nip19.decode(value);
            if (decoded.type === 'npub') {
              value = decoded.data;
            }
          }
        } catch {
          toast({
            title: 'Error',
            description: 'Invalid npub format',
            variant: 'destructive',
          });
          return;
        }
      }

      await muteItem.mutateAsync({
        type: muteType,
        value,
        reason: muteReason.trim() || undefined
      });

      toast({
        title: 'Muted',
        description: `Successfully added to mute list`,
      });

      // Reset form
      setMuteValue('');
      setMuteReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mute. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUnmute = async (type: MuteType, value: string) => {
    try {
      await unmuteItem.mutateAsync({ type, value });
      toast({
        title: 'Unmuted',
        description: 'Removed from mute list',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unmute. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Authentication Required</p>
            <p className="text-muted-foreground">
              Please log in to manage your moderation settings
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Shield className="h-8 w-8" />
          Moderation Settings
        </h1>
        <p className="text-muted-foreground">
          Control what content you see and report violations
        </p>
      </div>

      <Tabs defaultValue="mute-list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mute-list">
            <UserX className="h-4 w-4 mr-2" />
            Mute List
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag className="h-4 w-4 mr-2" />
            My Reports
          </TabsTrigger>
        </TabsList>

        {/* Mute List Tab */}
        <TabsContent value="mute-list" className="space-y-6">
          {/* Add to Mute List */}
          <Card>
            <CardHeader>
              <CardTitle>Add to Mute List</CardTitle>
              <CardDescription>
                Mute users, hashtags, keywords, or specific content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mute-type">Type</Label>
                  <Select value={muteType} onValueChange={(value) => setMuteType(value as MuteType)}>
                    <SelectTrigger id="mute-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MuteType.USER}>
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          User (npub or hex)
                        </div>
                      </SelectItem>
                      <SelectItem value={MuteType.HASHTAG}>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Hashtag
                        </div>
                      </SelectItem>
                      <SelectItem value={MuteType.KEYWORD}>
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Keyword
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mute-value">
                    {muteType === MuteType.USER && 'User (npub or pubkey)'}
                    {muteType === MuteType.HASHTAG && 'Hashtag (without #)'}
                    {muteType === MuteType.KEYWORD && 'Keyword or phrase'}
                  </Label>
                  <Input
                    id="mute-value"
                    placeholder={
                      muteType === MuteType.USER ? 'npub1...' :
                      muteType === MuteType.HASHTAG ? 'spam' :
                      'unwanted phrase'
                    }
                    value={muteValue}
                    onChange={(e) => setMuteValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mute-reason">Reason (optional)</Label>
                <Input
                  id="mute-reason"
                  placeholder="Why are you muting this?"
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                />
              </div>

              <Button onClick={handleMute} disabled={!muteValue.trim() || muteItem.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Mute List
              </Button>
            </CardContent>
          </Card>

          {/* Muted Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Muted Users ({mutedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {muteListLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : mutedUsers.length > 0 ? (
                <div className="space-y-2">
                  {mutedUsers.map((item) => (
                    <MutedUserItem
                      key={item.value}
                      pubkey={item.value}
                      reason={item.reason}
                      onUnmute={() => handleUnmute(MuteType.USER, item.value)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No muted users
                </p>
              )}
            </CardContent>
          </Card>

          {/* Muted Hashtags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Muted Hashtags ({mutedHashtags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mutedHashtags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mutedHashtags.map((item) => (
                    <Badge key={item.value} variant="secondary" className="gap-2">
                      #{item.value}
                      <button
                        onClick={() => handleUnmute(MuteType.HASHTAG, item.value)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No muted hashtags
                </p>
              )}
            </CardContent>
          </Card>

          {/* Muted Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Muted Keywords ({mutedKeywords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mutedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mutedKeywords.map((item) => (
                    <Badge key={item.value} variant="secondary" className="gap-2">
                      {item.value}
                      <button
                        onClick={() => handleUnmute(MuteType.KEYWORD, item.value)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No muted keywords
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                Content you've reported ({reportHistory.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportHistory.length > 0 ? (
                <div className="space-y-4">
                  {reportHistory.map((report) => (
                    <div key={report.reportId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-destructive" />
                          <span className="font-medium">
                            {REPORT_REASON_LABELS[report.reason]}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(report.createdAt * 1000, { addSuffix: true })}
                        </span>
                      </div>
                      {report.details && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {report.details}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        {report.eventId && (
                          <span className="font-mono">Event: {report.eventId.slice(0, 8)}...</span>
                        )}
                        {report.pubkey && (
                          <span className="font-mono">User: {report.pubkey.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    You haven't reported any content yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
