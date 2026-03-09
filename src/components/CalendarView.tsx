import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isPast } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Project } from '@/hooks/useProjects';
import { ProjectCoverThumbnail } from '@/components/ProjectCoverImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface CalendarViewProps {
  projects: Project[];
  onEdit: (project: Project) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/20 text-success border-success/30',
  completed: 'bg-primary/20 text-primary border-primary/30',
  'on-hold': 'bg-warning/20 text-warning border-warning/30',
  archived: 'bg-muted text-muted-foreground border-border',
};

export const CalendarView = ({ projects, onEdit }: CalendarViewProps) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get first day of week offset (0 = Sunday)
  const firstDayOffset = useMemo(() => {
    return startOfMonth(currentMonth).getDay();
  }, [currentMonth]);

  // Group projects by date
  const projectsByDate = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((project) => {
      if (project.due_date) {
        const dateKey = format(project.due_date, 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(project);
      }
    });
    return map;
  }, [projects]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {projects.filter((p) => p.due_date).length} projects with deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] rounded-lg bg-muted/30" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayProjects = projectsByDate.get(dateKey) || [];
            const isCurrentDay = isToday(day);
            const isPastDay = isPast(day) && !isCurrentDay;

            return (
              <div
                key={dateKey}
                className={cn(
                  'min-h-[100px] rounded-lg border p-1.5 transition-colors',
                  isCurrentDay
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:border-border hover:bg-muted/30',
                  !isSameMonth(day, currentMonth) && 'opacity-50'
                )}
              >
                <div
                  className={cn(
                    'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-0.5">
                  {dayProjects.slice(0, 3).map((project) => (
                    <HoverCard key={project.id} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <button
                          onClick={() => navigate(`/project/${project.id}`)}
                          className={cn(
                            'w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80',
                            statusColors[project.status]
                          )}
                        >
                          {project.name}
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent align="start" className="w-72">
                        <div className="space-y-2">
                          <ProjectCoverThumbnail
                            coverImageUrl={project.cover_image_url}
                            className="aspect-video rounded-md"
                          />
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">
                              {project.name}
                            </h4>
                            <Badge variant="outline" className={statusColors[project.status]}>
                              {project.status}
                            </Badge>
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due: {format(project.due_date!, 'dd MMM yyyy')}
                            </span>
                            {isPastDay && project.status !== 'completed' && (
                              <span className="flex items-center gap-1 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                              </span>
                            )}
                          </div>
                          {project.subtasks.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Progress: {project.subtasks.filter((s) => s.completed).length}/
                              {project.subtasks.length} subtasks
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                  {dayProjects.length > 3 && (
                    <div className="px-1.5 text-[10px] text-muted-foreground">
                      +{dayProjects.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">Status:</span>
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('h-2.5 w-2.5 rounded-full', color.split(' ')[0])} />
            <span className="text-xs capitalize text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
