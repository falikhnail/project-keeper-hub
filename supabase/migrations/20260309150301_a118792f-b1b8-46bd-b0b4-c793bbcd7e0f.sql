
-- Add cover_image_url column to projects
ALTER TABLE public.projects ADD COLUMN cover_image_url text DEFAULT NULL;

-- Create storage bucket for project covers
INSERT INTO storage.buckets (id, name, public) VALUES ('project-covers', 'project-covers', true);

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-covers');

-- Storage RLS: anyone can view covers (public bucket)
CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT USING (bucket_id = 'project-covers');

-- Storage RLS: authenticated users can delete their covers
CREATE POLICY "Authenticated users can delete covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-covers');

-- Storage RLS: authenticated users can update covers
CREATE POLICY "Authenticated users can update covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project-covers');
