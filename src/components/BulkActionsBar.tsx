import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, PauseCircle, Archive, PlayCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-2 border-r border-border pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {selectedCount}
                </div>
                <span className="text-sm font-medium text-foreground">
                  project{selectedCount > 1 ? 's' : ''} selected
                </span>
              </div>

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

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedCount} proyek?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data proyek yang dipilih termasuk subtasks, komentar, dan lampiran akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkDelete();
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus {selectedCount} Proyek
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
