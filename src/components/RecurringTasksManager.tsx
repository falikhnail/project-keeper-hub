import { useState } from 'react';
import { RefreshCw, Plus, Trash2, Pause, Play, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRecurringTasks, CRON_OPTIONS, RecurringTaskInput } from '@/hooks/useRecurringTasks';
import { useProjectTemplates } from '@/hooks/useProjectTemplates';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const RecurringTasksManager = () => {
  const { tasks, loading, createTask, toggleTask, deleteTask } = useRecurringTasks();
  const { templates, loading: templatesLoading } = useProjectTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<RecurringTaskInput>({
    template_id: '',
    name_prefix: '',
    cron_expression: '0 9 * * 1',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_id) return;
    setSaving(true);
    try {
      await createTask(formData);
      setDialogOpen(false);
      setFormData({ template_id: '', name_prefix: '', cron_expression: '0 9 * * 1' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recurring Tasks</h2>
            <p className="text-sm text-muted-foreground">Auto-create projects on schedule</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Recurring Task</DialogTitle>
              <DialogDescription>Automatically create projects from a template on a schedule</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Template *</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(v) => setFormData(f => ({ ...f, template_id: v }))}
                  disabled={saving || templatesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && !templatesLoading && (
                  <p className="text-xs text-muted-foreground">No templates yet. Save a project as template first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Project Name Prefix</Label>
                <Input
                  value={formData.name_prefix}
                  onChange={(e) => setFormData(f => ({ ...f, name_prefix: e.target.value }))}
                  placeholder="e.g. Weekly Sprint"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">Date will be appended automatically</p>
              </div>

              <div className="space-y-2">
                <Label>Schedule *</Label>
                <Select
                  value={formData.cron_expression}
                  onValueChange={(v) => setFormData(f => ({ ...f, cron_expression: v }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRON_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={!formData.template_id || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No recurring tasks yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create one to auto-generate projects on a schedule</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <Switch
                checked={task.is_active}
                onCheckedChange={(checked) => toggleTask(task.id, checked)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {task.name_prefix || task.template_name}
                  </span>
                  <Badge variant={task.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {task.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.cron_label}
                  </span>
                  {task.next_run_at && (
                    <span className="text-xs text-muted-foreground">
                      Next: {format(task.next_run_at, 'dd MMM, HH:mm', { locale: idLocale })}
                    </span>
                  )}
                  {task.last_run_at && (
                    <span className="text-xs text-muted-foreground">
                      Last: {format(task.last_run_at, 'dd MMM', { locale: idLocale })}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTask(task.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
