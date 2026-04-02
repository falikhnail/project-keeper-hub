import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Loader2, ExternalLink, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSlackNotifications } from '@/hooks/useSlackNotifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const SlackSettings = () => {
  const { config, loading, saving, saveConfig, deleteConfig, testWebhook } = useSlackNotifications();

  const [webhookUrl, setWebhookUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyHandler, setNotifyHandler] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (config) {
      setWebhookUrl(config.webhook_url);
      setIsActive(config.is_active);
      setNotifyStatus(config.notify_status_change);
      setNotifyComments(config.notify_comments);
      setNotifyDeadlines(config.notify_deadlines);
      setNotifyHandler(config.notify_handler_change);
    }
  }, [config]);

  const handleSave = async () => {
    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      return;
    }
    await saveConfig({
      webhook_url: webhookUrl,
      is_active: isActive,
      notify_status_change: notifyStatus,
      notify_comments: notifyComments,
      notify_deadlines: notifyDeadlines,
      notify_handler_change: notifyHandler,
    });
    setOpen(false);
  };

  const handleDelete = async () => {
    await deleteConfig();
    setWebhookUrl('');
    setIsActive(true);
    setNotifyStatus(true);
    setNotifyComments(true);
    setNotifyDeadlines(true);
    setNotifyHandler(true);
  };

  const isValidUrl = webhookUrl.startsWith('https://hooks.slack.com/');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Slack
          {config?.is_active && (
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Slack Notifications
          </DialogTitle>
          <DialogDescription>
            Hubungkan dengan Slack untuk menerima notifikasi project secara real-time.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://hooks.slack.com/services/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              {webhookUrl && !isValidUrl && (
                <p className="text-xs text-destructive">URL harus dimulai dengan https://hooks.slack.com/</p>
              )}
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                Cara membuat Webhook URL <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Separator />

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aktifkan Notifikasi</Label>
                <p className="text-xs text-muted-foreground">Master switch untuk semua notifikasi</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <Separator />

            {/* Event Toggles */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                Jenis Notifikasi
              </Label>

              <div className="space-y-3 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">🔄 Status berubah</Label>
                  <Switch checked={notifyStatus} onCheckedChange={setNotifyStatus} disabled={!isActive} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">💬 Komentar baru</Label>
                  <Switch checked={notifyComments} onCheckedChange={setNotifyComments} disabled={!isActive} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">⏰ Pengingat deadline</Label>
                  <Switch checked={notifyDeadlines} onCheckedChange={setNotifyDeadlines} disabled={!isActive} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">👤 Handler berubah</Label>
                  <Switch checked={notifyHandler} onCheckedChange={setNotifyHandler} disabled={!isActive} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!isValidUrl || saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
              {isValidUrl && (
                <Button variant="outline" size="icon" onClick={() => testWebhook(webhookUrl)} title="Test webhook">
                  <Send className="h-4 w-4" />
                </Button>
              )}
              {config && (
                <Button variant="destructive" size="icon" onClick={handleDelete} disabled={saving} title="Hapus konfigurasi">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
