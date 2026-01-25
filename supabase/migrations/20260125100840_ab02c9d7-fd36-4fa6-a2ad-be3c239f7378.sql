-- Create subtasks table
CREATE TABLE public.project_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view subtasks"
ON public.project_subtasks
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create subtasks"
ON public.project_subtasks
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = project_subtasks.created_by));

CREATE POLICY "Authenticated users can update subtasks"
ON public.project_subtasks
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete subtasks"
ON public.project_subtasks
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_project_subtasks_updated_at
BEFORE UPDATE ON public.project_subtasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_subtasks;