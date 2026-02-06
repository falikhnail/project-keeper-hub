import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, PauseCircle, Archive, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: ProjectStatus) => void;
  onBulkDelete: () => void;
}

const statusOptions: { value: ProjectStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: 'active', label: 'Active', icon: PlayCircle },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'on-hold', label: 'On Hold', icon: PauseCircle },
  { value: 'archived', label: 'Archived', icon: Archive },
];

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkDelete,
}: BulkActionsBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg backdrop-blur-xl">
            {/* Selection count */}
            <div className="flex items-center gap-2 border-r border-border pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {selectedCount}
              </div>
              <span className="text-sm font-medium text-foreground">
                project{selectedCount > 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Status change */}
            <Select onValueChange={(value: ProjectStatus) => onBulkStatusChange(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Delete button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="gap-2"
            >
              Delete
            </Button>

            {/* Clear selection */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
