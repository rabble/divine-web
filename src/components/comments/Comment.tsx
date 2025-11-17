import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { useComments } from '@/hooks/useComments';
import { CommentForm } from './CommentForm';
import { NoteContent } from '@/components/NoteContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageSquare, ChevronDown, ChevronRight, MoreHorizontal, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { genUserName } from '@/lib/genUserName';
import { getSafeProfileImage } from '@/lib/imageUtils';

interface CommentProps {
  root: NostrEvent | URL;
  comment: NostrEvent;
  depth?: number;
  limit?: number;
  parentComment?: NostrEvent; // For showing "replying to" preview
}

export function Comment({ root, comment, depth = 0, limit, parentComment }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true); // Auto-expand all replies by default

  const author = useAuthor(comment.pubkey);
  const parentAuthor = useAuthor(parentComment?.pubkey || '');
  const { data: commentsData } = useComments(root, limit);

  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(comment.pubkey);
  const timeAgo = formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true });

  // Get direct replies to this comment
  const replies = commentsData?.getDirectReplies(comment.id) || [];
  const hasReplies = replies.length > 0;

  // Auto-expand replies when new ones are added
  useEffect(() => {
    if (hasReplies) {
      setShowReplies(true);
    }
  }, [hasReplies, replies.length]);

  // Parent comment info for "replying to" preview (depth >= 2)
  const parentMetadata = parentAuthor.data?.metadata;
  const parentDisplayName = parentMetadata?.name ?? (parentComment ? genUserName(parentComment.pubkey) : '');
  const shouldShowReplyingTo = depth >= 2 && parentComment;

  return (
    <div className={`space-y-3 ${depth === 1 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* "Replying to" preview for depth >= 2 */}
            {shouldShowReplyingTo && (
              <div className="flex items-start space-x-2 p-2 bg-muted/30 rounded-md border border-muted">
                <CornerDownRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Link to={`/${nip19.npubEncode(parentComment.pubkey)}`}>
                      <Avatar className="h-5 w-5 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
                        <AvatarImage src={getSafeProfileImage(parentMetadata?.picture)} />
                        <AvatarFallback className="text-[10px]">
                          {parentDisplayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      to={`/${nip19.npubEncode(parentComment.pubkey)}`}
                      className="font-medium text-xs hover:text-primary transition-colors"
                    >
                      {parentDisplayName}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {parentComment.content}
                  </p>
                </div>
              </div>
            )}

            {/* Comment Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Link to={`/${nip19.npubEncode(comment.pubkey)}`}>
                  <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
                    <AvatarImage src={getSafeProfileImage(metadata?.picture)} />
                    <AvatarFallback className="text-xs">
                      {displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    to={`/${nip19.npubEncode(comment.pubkey)}`}
                    className="font-medium text-sm hover:text-primary transition-colors"
                  >
                    {displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground"
                    title={new Date(comment.created_at * 1000).toLocaleString()}>
                    {timeAgo}
                  </p>
                </div>
              </div>
            </div>

            {/* Comment Content */}
            <div className="text-sm">
              <NoteContent event={comment} className="text-sm" />
            </div>

            {/* Comment Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 px-2 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>

                {hasReplies && (
                  <Collapsible open={showReplies} onOpenChange={setShowReplies}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        {showReplies ? (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1" />
                        )}
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                )}
              </div>

              {/* Comment menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    aria-label="Comment options"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {showReplyForm && (
        <div className={depth === 0 ? "ml-6" : ""}>
          <CommentForm
            root={root}
            reply={comment}
            onSuccess={() => {
              setShowReplyForm(false);
              setShowReplies(true); // Auto-expand replies after posting
            }}
            placeholder="Write a reply..."
            compact
          />
        </div>
      )}

      {/* Replies - Only indent one level deep */}
      {hasReplies && (
        <Collapsible open={showReplies} onOpenChange={setShowReplies}>
          <CollapsibleContent className="space-y-3">
            {replies.map((reply) => (
              <Comment
                key={reply.id}
                root={root}
                comment={reply}
                depth={depth + 1}
                limit={limit}
                parentComment={comment} // Pass parent for "replying to" preview
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}