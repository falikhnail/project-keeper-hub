-- Add due_date column to projects table
ALTER TABLE public.projects 
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add reminder_days column (days before due date to show reminder)
ALTER TABLE public.projects 
ADD COLUMN reminder_days INTEGER DEFAULT 3;