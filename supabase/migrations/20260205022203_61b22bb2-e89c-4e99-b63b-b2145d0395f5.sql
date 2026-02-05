-- Create project templates table
CREATE TABLE public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_tags TEXT[] DEFAULT '{}',
  default_reminder_days INTEGER DEFAULT 3,
  subtask_titles TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Users can view their own templates"
ON public.project_templates FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = created_by));

CREATE POLICY "Users can create their own templates"
ON public.project_templates FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = created_by));

CREATE POLICY "Users can update their own templates"
ON public.project_templates FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = created_by));

CREATE POLICY "Users can delete their own templates"
ON public.project_templates FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = created_by));

-- Trigger for updated_at
CREATE TRIGGER update_project_templates_updated_at
BEFORE UPDATE ON public.project_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();