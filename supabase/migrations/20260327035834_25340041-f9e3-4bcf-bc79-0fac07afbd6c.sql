
-- 1. Auto-status trigger: when all subtasks completed, mark project as completed
CREATE OR REPLACE FUNCTION public.auto_complete_project_on_subtasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_count integer;
  completed_count integer;
  current_status text;
BEGIN
  -- Only proceed if a subtask was marked as completed
  IF NEW.completed = true AND (OLD.completed IS DISTINCT FROM NEW.completed) THEN
    SELECT count(*), count(*) FILTER (WHERE completed = true)
    INTO total_count, completed_count
    FROM public.project_subtasks
    WHERE project_id = NEW.project_id;

    SELECT status INTO current_status FROM public.projects WHERE id = NEW.project_id;

    -- Auto-complete if all subtasks done and project is active
    IF total_count > 0 AND total_count = completed_count AND current_status = 'active' THEN
      UPDATE public.projects SET status = 'completed', updated_at = now() WHERE id = NEW.project_id;
      
      INSERT INTO public.project_activities (project_id, type, description, old_value, new_value)
      VALUES (NEW.project_id, 'status_changed', 'Auto-completed: all subtasks finished', 'active', 'completed');
    END IF;
  END IF;

  -- Auto-reactivate if a subtask is unchecked and project is completed
  IF NEW.completed = false AND (OLD.completed IS DISTINCT FROM NEW.completed) THEN
    SELECT status INTO current_status FROM public.projects WHERE id = NEW.project_id;
    
    IF current_status = 'completed' THEN
      UPDATE public.projects SET status = 'active', updated_at = now() WHERE id = NEW.project_id;
      
      INSERT INTO public.project_activities (project_id, type, description, old_value, new_value)
      VALUES (NEW.project_id, 'status_changed', 'Auto-reactivated: subtask unchecked', 'completed', 'active');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_complete_project
AFTER UPDATE ON public.project_subtasks
FOR EACH ROW
EXECUTE FUNCTION public.auto_complete_project_on_subtasks();

-- 2. Add default_handler_ids to project_templates for auto-assign
ALTER TABLE public.project_templates
ADD COLUMN default_handler_ids uuid[] DEFAULT '{}'::uuid[];

-- 3. Create recurring_tasks table
CREATE TABLE public.recurring_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.project_templates(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cron_expression text NOT NULL DEFAULT '0 9 * * 1',
  name_prefix text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring tasks"
ON public.recurring_tasks FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = recurring_tasks.created_by));

CREATE POLICY "Users can create their own recurring tasks"
ON public.recurring_tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = recurring_tasks.created_by));

CREATE POLICY "Users can update their own recurring tasks"
ON public.recurring_tasks FOR UPDATE TO authenticated
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = recurring_tasks.created_by));

CREATE POLICY "Users can delete their own recurring tasks"
ON public.recurring_tasks FOR DELETE TO authenticated
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = recurring_tasks.created_by));
