import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { ProjectComment, Profile } from '@/hooks/useProjects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface CommentsSectionProps {
  comments: ProjectComment[];
  currentUserProfileId: string | undefined;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export const CommentsSection = ({
  comments,
  currentUserProfileId,
  onAddComment,
  onDeleteComment,
}: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    await onAddComment(newComment);
    setNewComment('');
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    setDeleting(commentId);
    await onDeleteComment(commentId);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Be the first to leave a note!</p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const authorName = comment.author?.display_name || comment.author?.email || 'Unknown';
            const initials = authorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const isOwner = currentUserProfileId && comment.author?.id === currentUserProfileId;

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-secondary text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {authorName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.created_at, {
                            addSuffix: true,
                            locale: id,
                          })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleting === comment.id}
                      title="Delete comment"
                    >
                      {deleting === comment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
