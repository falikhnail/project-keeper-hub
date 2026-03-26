
-- Time entries table for tracking work sessions
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  subtask_id UUID REFERENCES public.project_subtasks(id) ON DELETE SET NULL,
  user_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  is_running BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view time entries" ON public.time_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own time entries" ON public.time_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = time_entries.user_profile_id));

CREATE POLICY "Users can update their own time entries" ON public.time_entries
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = time_entries.user_profile_id));

CREATE POLICY "Users can delete their own time entries" ON public.time_entries
  FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = time_entries.user_profile_id));

-- Trigger for updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
