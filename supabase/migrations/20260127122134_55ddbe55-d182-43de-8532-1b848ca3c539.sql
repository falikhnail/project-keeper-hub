-- Create storage bucket for project attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-attachments', 'project-attachments', true);

-- Create policies for project attachments bucket
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated users can delete their attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-attachments');

-- Create project_attachments table to track files
CREATE TABLE public.project_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_attachments
CREATE POLICY "Authenticated users can view attachments"
ON public.project_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can upload attachments"
ON public.project_attachments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = uploaded_by));

CREATE POLICY "Users can delete their own attachments"
ON public.project_attachments FOR DELETE
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = uploaded_by));