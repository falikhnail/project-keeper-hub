import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { ProjectComment, Profile } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { MentionInput } from './MentionInput';
import { CommentThread } from './CommentThread';
import { supabase } from '@/integrations/supabase/client';

interface CommentsSectionProps {
  comments: ProjectComment[];
  currentUserProfileId: string | undefined;
  onAddComment: (content: string, mentions: string[], parentId?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string, mentions: string[]) => Promise<void>;
}

export const CommentsSection = ({
  comments,
  currentUserProfileId,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
}: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        setAllProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    await onAddComment(newComment, mentions);
    setNewComment('');
    setMentions([]);
    setSubmitting(false);
  };

  const handleAddReply = async (content: string, replyMentions: string[], parentId: string) => {
    await onAddComment(content, replyMentions, parentId);
  };

  // Separate top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parentCommentId === commentId).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <MentionInput
          value={newComment}
          onChange={(val, newMentions) => {
            setNewComment(val);
            setMentions(newMentions);
          }}
          placeholder="Write a comment... Use @ to mention team members"
          profiles={allProfiles}
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
        {topLevelComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Be the first to leave a note!</p>
          </div>
        ) : (
          topLevelComments.map((comment, index) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              allProfiles={allProfiles}
              currentUserProfileId={currentUserProfileId}
              onAddReply={handleAddReply}
              onDeleteComment={onDeleteComment}
              onUpdateComment={onUpdateComment}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
};