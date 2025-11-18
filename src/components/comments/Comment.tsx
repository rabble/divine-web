import { useState } from 'react';
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

interface CommentProps {
  root: NostrEvent | URL;
  comment: NostrEvent;
  depth?: number;
  maxDepth?: number;
  limit?: number;
  parentComment?: NostrEvent; // Parent comment for reply context
}

export function Comment({ root, comment, depth = 0, maxDepth = 3, limit, parentComment }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first 2 levels
  
  const author = useAuthor(comment.pubkey);
  const { data: commentsData } = useComments(root, limit);
  
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(comment.pubkey)
  const timeAgo = formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true });

  // Get direct replies to this comment
  const replies = commentsData?.getDirectReplies(comment.id) || [];
  const hasReplies = replies.length > 0;

  // Parent comment data (passed as prop when this is a reply)
  const parentAuthor = useAuthor(parentComment?.pubkey || '');
  const parentMetadata = parentAuthor.data?.metadata;
  const parentDisplayName = parentComment ? (parentMetadata?.name ?? genUserName(parentComment.pubkey)) : '';

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Comment Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Link to={`/${nip19.npubEncode(comment.pubkey)}`}>
                  <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
                    <AvatarImage src={metadata?.picture} />
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
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
            </div>

            {/* Reply Preview - Show what comment this is replying to */}
            {parentComment && (
              <div className="flex items-start gap-2 px-3 py-2 bg-muted/30 rounded-md border-l-2 border-muted-foreground/20">
                <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar className="h-4 w-4 shrink-0">
                    <AvatarImage src={parentMetadata?.picture} />
                    <AvatarFallback className="text-[8px]">
                      {parentDisplayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {parentDisplayName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {parentComment.content}
                  </span>
                </div>
              </div>
            )}

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
        <div className="ml-6">
          <CommentForm
            root={root}
            reply={comment}
            onSuccess={() => setShowReplyForm(false)}
            placeholder="Write a reply..."
            compact
          />
        </div>
      )}

      {/* Replies */}
      {hasReplies && (
        <Collapsible open={showReplies} onOpenChange={setShowReplies}>
          <CollapsibleContent className="space-y-3">
            {replies.map((reply) => (
              <Comment
                key={reply.id}
                root={root}
                comment={reply}
                depth={depth + 1}
                maxDepth={maxDepth}
                limit={limit}
                parentComment={comment}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}