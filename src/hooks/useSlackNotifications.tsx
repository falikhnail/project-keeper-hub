import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SlackConfig {
  id: string;
  webhook_url: string;
  is_active: boolean;
  notify_status_change: boolean;
  notify_comments: boolean;
  notify_deadlines: boolean;
  notify_handler_change: boolean;
}

export const useSlackNotifications = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<SlackConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('slack_webhook_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as SlackConfig | null);
    } catch (err) {
      console.error('Error fetching Slack config:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (values: Partial<SlackConfig> & { webhook_url: string }) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (config) {
        const { error } = await supabase
          .from('slack_webhook_configs')
          .update({
            webhook_url: values.webhook_url,
            is_active: values.is_active ?? true,
            notify_status_change: values.notify_status_change ?? true,
            notify_comments: values.notify_comments ?? true,
            notify_deadlines: values.notify_deadlines ?? true,
            notify_handler_change: values.notify_handler_change ?? true,
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('slack_webhook_configs')
          .insert({
            user_id: user.id,
            webhook_url: values.webhook_url,
            is_active: values.is_active ?? true,
            notify_status_change: values.notify_status_change ?? true,
            notify_comments: values.notify_comments ?? true,
            notify_deadlines: values.notify_deadlines ?? true,
            notify_handler_change: values.notify_handler_change ?? true,
          });

        if (error) throw error;
      }

      await fetchConfig();
      toast({ title: 'Berhasil', description: 'Konfigurasi Slack berhasil disimpan' });
    } catch (err: any) {
      console.error('Error saving Slack config:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('slack_webhook_configs')
        .delete()
        .eq('id', config.id);

      if (error) throw error;
      setConfig(null);
      toast({ title: 'Berhasil', description: 'Konfigurasi Slack berhasil dihapus' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async (payload: {
    event_type: 'status_change' | 'comment' | 'deadline' | 'handler_change';
    project_name: string;
    project_id: string;
    details: Record<string, string>;
  }) => {
    if (!config?.is_active) return;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-slack-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );
    } catch (err) {
      console.error('Failed to send Slack notification:', err);
    }
  };

  const testWebhook = async (webhookUrl: string) => {
    try {
      const payload = {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "✅ Test Notifikasi Berhasil!", emoji: true },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: "Webhook Slack Anda sudah terhubung dengan Project Manager." },
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      toast({ title: 'Test Terkirim', description: 'Cek channel Slack Anda untuk memastikan pesan diterima.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Gagal mengirim test. Periksa URL webhook.', variant: 'destructive' });
    }
  };

  return { config, loading, saving, saveConfig, deleteConfig, sendNotification, testWebhook };
};
