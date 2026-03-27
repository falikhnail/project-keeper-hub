import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface RecurringTask {
  id: string;
  template_id: string;
  template_name: string;
  name_prefix: string;
  cron_expression: string;
  cron_label: string;
  is_active: boolean;
  last_run_at: Date | null;
  next_run_at: Date | null;
  created_at: Date;
}

export interface RecurringTaskInput {
  template_id: string;
  name_prefix: string;
  cron_expression: string;
  is_active?: boolean;
}

const CRON_LABELS: Record<string, string> = {
  '0 9 * * 1': 'Weekly (Monday 09:00)',
  '0 9 * * *': 'Daily (09:00)',
  '0 9 * * 1-5': 'Weekdays (09:00)',
  '0 9 1 * *': 'Monthly (1st, 09:00)',
  '0 9 15 * *': 'Monthly (15th, 09:00)',
};

export const getCronLabel = (cron: string) => CRON_LABELS[cron] || cron;

export const CRON_OPTIONS = Object.entries(CRON_LABELS).map(([value, label]) => ({ value, label }));

export const useRecurringTasks = () => {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*, project_templates(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks((data || []).map((t: any) => ({
        id: t.id,
        template_id: t.template_id,
        template_name: t.project_templates?.name || 'Unknown',
        name_prefix: t.name_prefix || '',
        cron_expression: t.cron_expression,
        cron_label: getCronLabel(t.cron_expression),
        is_active: t.is_active,
        last_run_at: t.last_run_at ? new Date(t.last_run_at) : null,
        next_run_at: t.next_run_at ? new Date(t.next_run_at) : null,
        created_at: new Date(t.created_at),
      })));
    } catch (error: any) {
      console.error('Error fetching recurring tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (input: RecurringTaskInput) => {
    if (!profile) return;
    try {
      // Calculate first next_run_at
      const now = new Date();
      const nextRun = calculateNextRunClient(input.cron_expression, now);

      const { error } = await supabase
        .from('recurring_tasks')
        .insert({
          template_id: input.template_id,
          created_by: profile.id,
          name_prefix: input.name_prefix,
          cron_expression: input.cron_expression,
          is_active: input.is_active ?? true,
          next_run_at: nextRun.toISOString(),
        } as any);

      if (error) throw error;
      toast({ title: 'Recurring task created', description: 'Projects will be auto-created on schedule.' });
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleTask = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_tasks')
        .update({ is_active: isActive } as any)
        .eq('id', id);
      if (error) throw error;
      toast({ title: isActive ? 'Task activated' : 'Task paused' });
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('recurring_tasks').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Recurring task deleted', variant: 'destructive' });
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return { tasks, loading, createTask, toggleTask, deleteTask, refetch: fetchTasks };
};

function calculateNextRunClient(cron: string, from: Date): Date {
  const parts = cron.split(' ');
  const next = new Date(from);
  if (parts.length === 5) {
    const [minute, hour, dayOfMonth, , dayOfWeek] = parts;
    if (dayOfMonth === '*' && dayOfWeek === '*') {
      next.setDate(next.getDate() + 1);
      next.setHours(parseInt(hour) || 9, parseInt(minute) || 0, 0, 0);
      return next;
    }
    if (dayOfMonth === '*' && dayOfWeek !== '*') {
      const dow = dayOfWeek.includes('-') ? parseInt(dayOfWeek.split('-')[0]) : parseInt(dayOfWeek);
      let daysUntil = dow - next.getDay();
      if (daysUntil <= 0) daysUntil += 7;
      next.setDate(next.getDate() + daysUntil);
      next.setHours(parseInt(hour) || 9, parseInt(minute) || 0, 0, 0);
      return next;
    }
    if (dayOfMonth !== '*') {
      next.setMonth(next.getMonth() + 1);
      next.setDate(parseInt(dayOfMonth));
      next.setHours(parseInt(hour) || 9, parseInt(minute) || 0, 0, 0);
      return next;
    }
  }
  next.setDate(next.getDate() + 7);
  next.setHours(9, 0, 0, 0);
  return next;
}
