import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order_position: number;
  created_by: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
  created_at: Date;
}

interface SubtasksListProps {
  subtasks: Subtask[];
  onAddSubtask: (title: string) => Promise<void>;
  onToggleSubtask: (id: string, completed: boolean) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onUpdateSubtask: (id: string, title: string) => Promise<void>;
}

export const SubtasksList = ({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
}: SubtasksListProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await onAddSubtask(newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;
    await onUpdateSubtask(editingId, editingTitle.trim());
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const sortedSubtasks = [...subtasks].sort((a, b) => a.order_position - b.order_position);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {completedCount}/{subtasks.length} completed
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedSubtasks.map((subtask) => (
            <motion.div
              key={subtask.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={cn(
                'group flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card',
                subtask.completed && 'opacity-60'
              )}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={(checked) => onToggleSubtask(subtask.id, checked as boolean)}
                className="h-5 w-5"
              />

              {editingId === subtask.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => handleStartEdit(subtask)}
                    className={cn(
                      'flex-1 cursor-pointer text-sm text-foreground transition-colors hover:text-primary',
                      subtask.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {subtask.title}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add subtask */}
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter subtask title..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTitle('');
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setNewTitle('');
            }}
          >
            Cancel
          </Button>
        </motion.div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Subtask
        </Button>
      )}

      {/* Empty state */}
      {subtasks.length === 0 && !isAdding && (
        <p className="text-center text-sm text-muted-foreground">
          No subtasks yet. Add one to break down this project.
        </p>
      )}
    </div>
  );
};
