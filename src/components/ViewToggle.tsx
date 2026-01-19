import { LayoutGrid, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'kanban';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ viewMode, onViewModeChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'h-8 gap-2 px-3',
          viewMode === 'grid'
            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('kanban')}
        className={cn(
          'h-8 gap-2 px-3',
          viewMode === 'kanban'
            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline">Kanban</span>
      </Button>
    </div>
  );
};
