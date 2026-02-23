import { LayoutGrid, Columns3, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'kanban' | 'calendar';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ viewMode, onViewModeChange }: ViewToggleProps) => {
  const views: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
    { mode: 'kanban', icon: Columns3, label: 'Kanban' },
    { mode: 'calendar', icon: CalendarDays, label: 'Calendar' },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-1">
      {views.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange(mode)}
          className={cn(
            'h-8 gap-2 px-3 transition-all',
            viewMode === mode
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
};
