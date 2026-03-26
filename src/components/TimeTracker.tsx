import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Plus, Trash2, Clock, Timer, Users, CalendarDays, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTimeTracking, formatDuration, type TimeEntry } from '@/hooks/useTimeTracking';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TimeTrackerProps {
  projectId: string;
  subtasks?: { id: string; title: string }[];
}

// Live timer display component
const LiveTimer = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <span className="font-mono text-2xl font-bold text-primary tabular-nums">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
};

// Manual entry form
const ManualEntryForm = ({
  onSubmit,
  onCancel,
  subtasks,
}: {
  onSubmit: (data: { startTime: Date; endTime: Date; description?: string; subtaskId?: string }) => void;
  onCancel: () => void;
  subtasks?: { id: string; title: string }[];
}) => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [description, setDescription] = useState('');
  const [subtaskId, setSubtaskId] = useState('');

  const handleSubmit = () => {
    const startTime = new Date(`${date}T${startTimeStr}`);
    const endTime = new Date(`${date}T${endTimeStr}`);
    if (endTime <= startTime) return;
    onSubmit({ startTime, endTime, description: description || undefined, subtaskId: subtaskId || undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3 rounded-lg border border-border bg-card/50 p-4"
    >
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tanggal</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
          <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="h-9" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Selesai</label>
          <Input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="h-9" />
        </div>
      </div>
      <Input
        placeholder="Deskripsi pekerjaan (opsional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-9"
      />
      {subtasks && subtasks.length > 0 && (
        <select
          value={subtaskId}
          onChange={(e) => setSubtaskId(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">— Pilih subtask (opsional) —</option>
          {subtasks.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit}>Tambah</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Batal</Button>
      </div>
    </motion.div>
  );
};

export const TimeTracker = ({ projectId, subtasks }: TimeTrackerProps) => {
  const {
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
  } = useTimeTracking(projectId);

  const [showManual, setShowManual] = useState(false);
  const [timerDesc, setTimerDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState('');

  const handleStartTimer = () => {
    startTimer(undefined, timerDesc || undefined);
    setTimerDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Timer Control */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/80 p-6">
        {activeTimer ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              Timer sedang berjalan
            </div>
            <LiveTimer startTime={activeTimer.start_time} />
            {activeTimer.description && (
              <p className="text-sm text-muted-foreground">{activeTimer.description}</p>
            )}
            <Button variant="destructive" size="lg" onClick={stopTimer} className="gap-2">
              <Square className="h-4 w-4" />
              Stop Timer
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-2xl font-bold text-muted-foreground tabular-nums">
              00:00:00
            </span>
            <Input
              placeholder="Sedang mengerjakan apa? (opsional)"
              value={timerDesc}
              onChange={(e) => setTimerDesc(e.target.value)}
              className="max-w-sm text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleStartTimer()}
            />
            <Button size="lg" onClick={handleStartTimer} className="gap-2">
              <Play className="h-4 w-4" />
              Start Timer
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">Hari Ini</p>
          <p className="text-sm font-semibold text-foreground">{formatDuration(todaySeconds)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <CalendarDays className="mx-auto mb-1 h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">Minggu Ini</p>
          <p className="text-sm font-semibold text-foreground">{formatDuration(thisWeekSeconds)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Timer className="mx-auto mb-1 h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold text-foreground">{formatDuration(totalSeconds)}</p>
        </div>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="log" className="flex-1">Log Waktu</TabsTrigger>
          <TabsTrigger value="report" className="flex-1">Laporan Tim</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-3">
          {/* Add manual entry button */}
          <AnimatePresence>
            {showManual ? (
              <ManualEntryForm
                onSubmit={(data) => {
                  addManualEntry(data);
                  setShowManual(false);
                }}
                onCancel={() => setShowManual(false)}
                subtasks={subtasks}
              />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowManual(true)} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Log Waktu Manual
              </Button>
            )}
          </AnimatePresence>

          {/* Time entries list */}
          <div className="space-y-2">
            {entries.length === 0 && !loading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada log waktu. Mulai timer atau tambahkan secara manual.
              </p>
            )}
            <AnimatePresence mode="popLayout">
              {entries.filter(e => !e.is_running).map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
                >
                  <div className="flex-1 min-w-0">
                    {editingId === entry.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingDesc}
                          onChange={(e) => setEditingDesc(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateEntry(entry.id, editingDesc);
                              setEditingId(null);
                            }
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { updateEntry(entry.id, editingDesc); setEditingId(null); }}>
                          <Check className="h-3 w-3 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p
                          className="truncate text-sm text-foreground cursor-pointer hover:text-primary"
                          onClick={() => { setEditingId(entry.id); setEditingDesc(entry.description || ''); }}
                        >
                          {entry.description || 'Tanpa deskripsi'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.profile?.display_name || entry.profile?.email || '—'} · {format(new Date(entry.start_time), 'dd MMM HH:mm', { locale: localeId })}
                        </p>
                      </>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entry.duration_seconds ? formatDuration(entry.duration_seconds) : '—'}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="report" className="space-y-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Jam Kerja per Anggota
          </h3>
          {Object.keys(memberStats).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data untuk ditampilkan.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(memberStats)
                .sort(([, a], [, b]) => b - a)
                .map(([name, seconds]) => {
                  const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{name}</span>
                        <span className="font-mono font-medium text-foreground">{formatDuration(seconds)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
              <div className="mt-4 rounded-lg border border-border bg-card/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Jam Kerja Tim</p>
                <p className="text-lg font-bold text-foreground">{formatDuration(totalSeconds)}</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
