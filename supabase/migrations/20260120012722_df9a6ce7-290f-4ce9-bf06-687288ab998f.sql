-- Create comments table
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view comments"
ON public.project_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.project_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_id));

CREATE POLICY "Users can update their own comments"
ON public.project_comments FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_id));

CREATE POLICY "Users can delete their own comments"
ON public.project_comments FOR DELETE
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_id));

-- Trigger for updated_at
CREATE TRIGGER update_project_comments_updated_at
BEFORE UPDATE ON public.project_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_comments;