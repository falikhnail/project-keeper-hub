-- Create table for Slack webhook configurations
CREATE TABLE public.slack_webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_status_change BOOLEAN NOT NULL DEFAULT true,
  notify_comments BOOLEAN NOT NULL DEFAULT true,
  notify_deadlines BOOLEAN NOT NULL DEFAULT true,
  notify_handler_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.slack_webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own slack config"
  ON public.slack_webhook_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own slack config"
  ON public.slack_webhook_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own slack config"
  ON public.slack_webhook_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own slack config"
  ON public.slack_webhook_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_slack_webhook_configs_updated_at
  BEFORE UPDATE ON public.slack_webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();