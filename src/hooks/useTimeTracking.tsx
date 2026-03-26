import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TimeEntry {
  id: string;
  project_id: string;
  subtask_id: string | null;
  user_profile_id: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  is_running: boolean;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export const useTimeTracking = (projectId: string) => {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*, profile:profiles!time_entries_user_profile_id_fkey(id, display_name, email, avatar_url)')
      .eq('project_id', projectId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching time entries:', error);
      return;
    }

    const mapped = (data || []).map((e: any) => ({
      ...e,
      profile: e.profile || undefined,
    }));
    setEntries(mapped);

    const running = mapped.find(
      (e: TimeEntry) => e.is_running && e.user_profile_id === profile?.id
    );
    setActiveTimer(running || null);
    setLoading(false);
  }, [projectId, profile?.id]);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel(`time_entries_${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: `project_id=eq.${projectId}` }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEntries, projectId]);

  const startTimer = async (subtaskId?: string, description?: string) => {
    if (!profile?.id) return;

    // Stop any running timer first
    if (activeTimer) {
      await stopTimer();
    }

    const { error } = await supabase.from('time_entries').insert({
      project_id: projectId,
      user_profile_id: profile.id,
      subtask_id: subtaskId || null,
      description: description || null,
      start_time: new Date().toISOString(),
      is_running: true,
    });

    if (error) {
      toast.error('Gagal memulai timer');
      console.error(error);
      return;
    }
    toast.success('Timer dimulai');
    fetchEntries();
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    const now = new Date();
    const start = new Date(activeTimer.start_time);
    const durationSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: now.toISOString(),
        duration_seconds: durationSeconds,
        is_running: false,
      })
      .eq('id', activeTimer.id);

    if (error) {
      toast.error('Gagal menghentikan timer');
      console.error(error);
      return;
    }
    toast.success(`Timer dihentikan (${formatDuration(durationSeconds)})`);
    setActiveTimer(null);
    fetchEntries();
  };

  const addManualEntry = async (data: {
    startTime: Date;
    endTime: Date;
    description?: string;
    subtaskId?: string;
  }) => {
    if (!profile?.id) return;

    const durationSeconds = Math.floor(
      (data.endTime.getTime() - data.startTime.getTime()) / 1000
    );

    const { error } = await supabase.from('time_entries').insert({
      project_id: projectId,
      user_profile_id: profile.id,
      subtask_id: data.subtaskId || null,
      description: data.description || null,
      start_time: data.startTime.toISOString(),
      end_time: data.endTime.toISOString(),
      duration_seconds: durationSeconds,
      is_running: false,
    });

    if (error) {
      toast.error('Gagal menambahkan waktu');
      console.error(error);
      return;
    }
    toast.success('Waktu berhasil ditambahkan');
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus entry');
      return;
    }
    toast.success('Entry dihapus');
    fetchEntries();
  };

  const updateEntry = async (id: string, description: string) => {
    const { error } = await supabase
      .from('time_entries')
      .update({ description })
      .eq('id', id);
    if (error) {
      toast.error('Gagal mengupdate entry');
      return;
    }
    fetchEntries();
  };

  // Stats
  const totalSeconds = entries
    .filter((e) => !e.is_running && e.duration_seconds)
    .reduce((acc, e) => acc + (e.duration_seconds || 0), 0);

  const todaySeconds = entries
    .filter((e) => {
      if (e.is_running || !e.duration_seconds) return false;
      const today = new Date();
      const entryDate = new Date(e.start_time);
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((acc, e) => acc + (e.duration_seconds || 0), 0);

  const thisWeekSeconds = entries
    .filter((e) => {
      if (e.is_running || !e.duration_seconds) return false;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(e.start_time) >= weekAgo;
    })
    .reduce((acc, e) => acc + (e.duration_seconds || 0), 0);

  // Per-member stats
  const memberStats = entries
    .filter((e) => !e.is_running && e.duration_seconds)
    .reduce((acc, e) => {
      const name = e.profile?.display_name || e.profile?.email || 'Unknown';
      if (!acc[name]) acc[name] = 0;
      acc[name] += e.duration_seconds || 0;
      return acc;
    }, {} as Record<string, number>);

  return {
    entries,
    loading,
    activeTimer,
    startTimer,
    stopTimer,
    addManualEntry,
    deleteEntry,
    updateEntry,
    totalSeconds,
    todaySeconds,
    thisWeekSeconds,
    memberStats,
  };
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};
