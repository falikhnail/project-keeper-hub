import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Trash2, Loader2, Pencil, X, Check, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectComment, Profile } from '@/hooks/useProjects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MentionInput, renderMentionedContent } from './MentionInput';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface CommentThreadProps {
  comment: ProjectComment;
  replies: ProjectComment[];
  allProfiles: Profile[];
  currentUserProfileId: string | undefined;
  onAddReply: (content: string, mentions: string[], parentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string, mentions: string[]) => Promise<void>;
  index: number;
}

export const CommentThread = ({
  comment,
  replies,
  allProfiles,
  currentUserProfileId,
  onAddReply,
  onDeleteComment,
  onUpdateComment,
  index,
}: CommentThreadProps) => {
  const [showReplies, setShowReplies] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyMentions, setReplyMentions] = useState<string[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMentions, setEditMentions] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || submittingReply) return;

    setSubmittingReply(true);
    await onAddReply(replyContent, replyMentions, comment.id);
    setReplyContent('');
    setReplyMentions([]);
    setShowReplyForm(false);
    setSubmittingReply(false);
  };

  const handleStartEdit = (c: ProjectComment) => {
    setEditingId(c.id);
    setEditContent(c.content);
    setEditMentions(c.mentions || []);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditMentions([]);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim() || updating) return;

    setUpdating(true);
    await onUpdateComment(editingId, editContent, editMentions);
    setEditingId(null);
    setEditContent('');
    setEditMentions([]);
    setUpdating(false);
  };

  const handleDelete = async (commentId: string) => {
    setDeleting(commentId);
    await onDeleteComment(commentId);
    setDeleting(null);
  };

  const renderComment = (c: ProjectComment, isReply = false) => {
    const authorName = c.author?.display_name || c.author?.email || 'Unknown';
    const initials = authorName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const isOwner = currentUserProfileId && c.author?.id === currentUserProfileId;
    const isEditing = editingId === c.id;

    return (
      <div className={`group ${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className={`border border-border ${isReply ? 'h-7 w-7' : 'h-8 w-8'}`}>
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium text-foreground ${isReply ? 'text-xs' : 'text-sm'}`}>
                  {authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(c.created_at, {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
                {c.updated_at > c.created_at && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <MentionInput
                    value={editContent}
                    onChange={(val, mentions) => {
                      setEditContent(val);
                      setEditMentions(mentions);
                    }}
                    profiles={allProfiles}
                    className="min-h-[60px] resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || updating}
                      className="gap-1"
                    >
                      {updating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={updating}
                      className="gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`mt-1 whitespace-pre-wrap text-foreground ${isReply ? 'text-xs' : 'text-sm'}`}>
                  {renderMentionedContent(c.content, allProfiles)}
                </p>
              )}
            </div>
          </div>

          {isOwner && !isEditing && (
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleStartEdit(c)}
                title="Edit comment"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                title="Delete comment"
              >
                {deleting === c.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      {renderComment(comment)}

      {/* Reply button */}
      <div className="flex items-center gap-2 ml-11">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <Reply className="h-3.5 w-3.5" />
          Reply
        </Button>
        {replies.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-8 border-l-2 border-border pl-4 space-y-2">
          <MentionInput
            value={replyContent}
            onChange={(val, mentions) => {
              setReplyContent(val);
              setReplyMentions(mentions);
            }}
            placeholder="Write a reply... Use @ to mention team members"
            profiles={allProfiles}
            className="min-h-[60px] resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || submittingReply}
              className="gap-1"
            >
              {submittingReply ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
                setReplyMentions([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies list */}
      {showReplies && replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <div key={reply.id}>{renderComment(reply, true)}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
};