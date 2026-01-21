-- Add parent_comment_id for threaded replies
ALTER TABLE public.project_comments
ADD COLUMN parent_comment_id uuid REFERENCES public.project_comments(id) ON DELETE CASCADE;

-- Add index for faster reply lookups
CREATE INDEX idx_project_comments_parent ON public.project_comments(parent_comment_id);

-- Add mentions column to store mentioned profile IDs
ALTER TABLE public.project_comments
ADD COLUMN mentions uuid[] DEFAULT '{}';

-- Add index for mentions lookups
CREATE INDEX idx_project_comments_mentions ON public.project_comments USING GIN(mentions);