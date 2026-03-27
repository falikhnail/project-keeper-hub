import { useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, differenceInDays, startOfDay, endOfDay, isSameDay, isWithinInterval, startOfWeek, addWeeks } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface GanttSubtask {
  id: string;
  title: string;
  completed: boolean;
  start_date: Date | null;
  end_date: Date | null;
  dependencies: string[];
}

interface GanttProject {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  due_date: Date | null;
  created_at: Date;
  subtasks: GanttSubtask[];
  tags?: string[] | null;
}

interface GanttChartProps {
  projects: GanttProject[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/80',
  completed: 'bg-primary/80',
  'on-hold': 'bg-amber-500/80',
  archived: 'bg-muted-foreground/50',
};

const STATUS_BORDER: Record<string, string> = {
  active: 'border-emerald-500',
  completed: 'border-primary',
  'on-hold': 'border-amber-500',
  archived: 'border-muted-foreground',
};

const DAY_WIDTH_OPTIONS = [24, 36, 52];

export const GanttChart = ({ projects }: GanttChartProps) => {
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(1); // 0=small, 1=medium, 2=large
  const [weekOffset, setWeekOffset] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const dayWidth = DAY_WIDTH_OPTIONS[zoomLevel];
  const totalWeeks = zoomLevel === 0 ? 12 : zoomLevel === 1 ? 8 : 6;

  const startDate = useMemo(() => {
    const base = startOfWeek(new Date(), { locale: idLocale });
    return addWeeks(base, weekOffset);
  }, [weekOffset]);

  const endDate = useMemo(() => addDays(startDate, totalWeeks * 7), [startDate, totalWeeks]);
  const totalDays = totalWeeks * 7;

  // Build flat list of rows: project header + subtasks
  const rows = useMemo(() => {
    const result: Array<{
      type: 'project' | 'subtask';
      project: GanttProject;
      subtask?: GanttSubtask;
      barStart: number | null;
      barWidth: number | null;
    }> = [];

    for (const project of projects) {
      const pStart = project.created_at;
      const pEnd = project.due_date || addDays(pStart, 14);
      const startOff = Math.max(0, differenceInDays(startOfDay(pStart), startDate));
      const endOff = Math.min(totalDays, differenceInDays(startOfDay(pEnd), startDate) + 1);

      result.push({
        type: 'project',
        project,
        barStart: endOff > 0 && startOff < totalDays ? startOff : null,
        barWidth: endOff > 0 && startOff < totalDays ? Math.max(1, endOff - startOff) : null,
      });

      for (const subtask of project.subtasks) {
        if (!subtask.start_date && !subtask.end_date) {
          result.push({ type: 'subtask', project, subtask, barStart: null, barWidth: null });
          continue;
        }
        const sStart = subtask.start_date || pStart;
        const sEnd = subtask.end_date || addDays(sStart, 3);
        const sStartOff = Math.max(0, differenceInDays(startOfDay(sStart), startDate));
        const sEndOff = Math.min(totalDays, differenceInDays(startOfDay(sEnd), startDate) + 1);

        result.push({
          type: 'subtask',
          project,
          subtask,
          barStart: sEndOff > 0 && sStartOff < totalDays ? sStartOff : null,
          barWidth: sEndOff > 0 && sStartOff < totalDays ? Math.max(1, sEndOff - sStartOff) : null,
        });
      }
    }
    return result;
  }, [projects, startDate, totalDays]);

  // Build dependency arrows
  const arrows = useMemo(() => {
    const result: Array<{ fromX: number; fromY: number; toX: number; toY: number; color: string }> = [];
    const rowHeight = 40;
    const headerHeight = 56;

    const subtaskRowIndex = new Map<string, number>();
    rows.forEach((r, i) => {
      if (r.subtask) subtaskRowIndex.set(r.subtask.id, i);
    });

    rows.forEach((row, rowIdx) => {
      if (!row.subtask || !row.subtask.dependencies.length) return;
      for (const depId of row.subtask.dependencies) {
        const depRowIdx = subtaskRowIndex.get(depId);
        if (depRowIdx === undefined) continue;
        const depRow = rows[depRowIdx];
        if (depRow.barStart === null || depRow.barWidth === null) continue;
        if (row.barStart === null) continue;

        const fromX = (depRow.barStart + depRow.barWidth) * dayWidth;
        const fromY = headerHeight + depRowIdx * rowHeight + rowHeight / 2;
        const toX = row.barStart * dayWidth;
        const toY = headerHeight + rowIdx * rowHeight + rowHeight / 2;

        result.push({ fromX, fromY, toX, toY, color: STATUS_BORDER[depRow.project.status] || 'border-border' });
      }
    });

    return result;
  }, [rows, dayWidth]);

  // Generate day headers
  const days = useMemo(() => {
    const d: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      d.push(addDays(startDate, i));
    }
    return d;
  }, [startDate, totalDays]);

  const today = startOfDay(new Date());
  const todayOffset = differenceInDays(today, startDate);

  const rowHeight = 40;
  const headerHeight = 56;
  const chartHeight = headerHeight + rows.length * rowHeight;
  const chartWidth = totalDays * dayWidth;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card/80">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 2)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="h-8 text-xs">
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 2)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {format(startDate, 'dd MMM', { locale: idLocale })} — {format(endDate, 'dd MMM yyyy', { locale: idLocale })}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={zoomLevel === 0} onClick={() => setZoomLevel(z => Math.max(0, z - 1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={zoomLevel === 2} onClick={() => setZoomLevel(z => Math.min(2, z + 1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Left sidebar - labels */}
        <div className="shrink-0 border-r border-border bg-card z-10" style={{ width: 220 }}>
          <div className="h-14 border-b border-border px-3 flex items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project / Task</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.subtask ? row.subtask.id : row.project.id + '-header'}
              className={cn(
                'flex items-center gap-2 border-b border-border/50 px-3',
                row.type === 'project' ? 'bg-secondary/30 font-semibold' : 'pl-7'
              )}
              style={{ height: rowHeight }}
            >
              {row.type === 'project' ? (
                <button
                  onClick={() => navigate(`/project/${row.project.id}`)}
                  className="truncate text-sm text-foreground hover:text-primary transition-colors text-left"
                  title={row.project.name}
                >
                  {row.project.name}
                </button>
              ) : (
                <span className={cn('truncate text-xs', row.subtask?.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>
                  {row.subtask?.title}
                </span>
              )}
              {row.subtask && row.subtask.dependencies.length > 0 && (
                <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Right side - timeline */}
        <ScrollArea className="flex-1">
          <div className="relative" style={{ width: chartWidth, minHeight: chartHeight }}>
            {/* Day headers */}
            <div className="flex sticky top-0 z-10 bg-card border-b border-border" style={{ height: headerHeight }}>
              {days.map((day, i) => {
                const isToday = isSameDay(day, today);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isMonday = day.getDay() === 1;
                return (
                  <div
                    key={i}
                    className={cn(
                      'shrink-0 border-r border-border/30 flex flex-col items-center justify-center',
                      isToday && 'bg-primary/10',
                      isWeekend && 'bg-muted/30'
                    )}
                    style={{ width: dayWidth }}
                  >
                    {(isMonday || i === 0 || zoomLevel === 2) && (
                      <span className="text-[10px] text-muted-foreground">{format(day, 'MMM', { locale: idLocale })}</span>
                    )}
                    <span className={cn('text-xs font-medium', isToday ? 'text-primary' : isWeekend ? 'text-muted-foreground' : 'text-foreground')}>
                      {format(day, 'd')}
                    </span>
                    {zoomLevel >= 1 && (
                      <span className="text-[9px] text-muted-foreground">{format(day, 'EEE', { locale: idLocale })}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today line */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-20"
                style={{ left: todayOffset * dayWidth + dayWidth / 2 }}
              />
            )}

            {/* Grid rows */}
            {rows.map((row, i) => (
              <div
                key={row.subtask ? row.subtask.id : row.project.id + '-bar'}
                className={cn('relative border-b border-border/30', row.type === 'project' && 'bg-secondary/20')}
                style={{ height: rowHeight }}
              >
                {/* Weekend shading */}
                {days.map((day, di) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  if (!isWeekend) return null;
                  return (
                    <div key={di} className="absolute top-0 bottom-0 bg-muted/20" style={{ left: di * dayWidth, width: dayWidth }} />
                  );
                })}

                {/* Bar */}
                {row.barStart !== null && row.barWidth !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'absolute top-2 rounded-md cursor-pointer transition-all hover:brightness-110',
                            row.type === 'project' ? STATUS_COLORS[row.project.status] : 'bg-primary/60',
                            row.subtask?.completed && 'opacity-50'
                          )}
                          style={{
                            left: row.barStart * dayWidth + 2,
                            width: Math.max(row.barWidth * dayWidth - 4, 8),
                            height: rowHeight - 16,
                          }}
                          onClick={() => navigate(`/project/${row.project.id}`)}
                        >
                          {row.barWidth * dayWidth > 60 && (
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate">
                              {row.type === 'project' ? row.project.name : row.subtask?.title}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-semibold text-sm">{row.type === 'project' ? row.project.name : row.subtask?.title}</p>
                        {row.subtask?.start_date && (
                          <p className="text-xs text-muted-foreground">
                            {format(row.subtask.start_date, 'dd MMM yyyy')} → {row.subtask.end_date ? format(row.subtask.end_date, 'dd MMM yyyy') : '—'}
                          </p>
                        )}
                        {row.type === 'project' && row.project.due_date && (
                          <p className="text-xs text-muted-foreground">Due: {format(row.project.due_date, 'dd MMM yyyy')}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}

            {/* Dependency arrows (SVG overlay) */}
            <svg ref={svgRef} className="absolute top-0 left-0 pointer-events-none z-10" width={chartWidth} height={chartHeight}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" className="fill-primary/60" />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const midX = a.fromX + (a.toX - a.fromX) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${a.fromX} ${a.fromY} C ${midX} ${a.fromY}, ${midX} ${a.toY}, ${a.toX} ${a.toY}`}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.4)"
                    strokeWidth={1.5}
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-border px-4 py-2">
        {Object.entries({ active: 'Active', completed: 'Completed', 'on-hold': 'On Hold', archived: 'Archived' }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded-sm', STATUS_COLORS[key])} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <Link2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Dependency</span>
        </div>
      </div>
    </motion.div>
  );
};
