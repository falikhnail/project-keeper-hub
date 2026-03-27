
ALTER TABLE public.project_subtasks 
ADD COLUMN start_date timestamp with time zone DEFAULT NULL,
ADD COLUMN end_date timestamp with time zone DEFAULT NULL,
ADD COLUMN dependencies uuid[] DEFAULT '{}'::uuid[];
