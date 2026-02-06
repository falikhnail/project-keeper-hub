import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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

interface DraggableSubtasksListProps {
  subtasks: Subtask[];
  onAddSubtask: (title: string) => Promise<void>;
  onToggleSubtask: (id: string, completed: boolean) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onUpdateSubtask: (id: string, title: string) => Promise<void>;
  onReorderSubtasks: (subtaskIds: string[]) => Promise<void>;
}

export const DraggableSubtasksList = ({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  onReorderSubtasks,
}: DraggableSubtasksListProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const sortedSubtasks = [...subtasks].sort((a, b) => a.order_position - b.order_position);

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(sortedSubtasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Send reordered IDs to backend
    await onReorderSubtasks(items.map((item) => item.id));
  };

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

      {/* Draggable Subtasks list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="subtasks">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                'space-y-2 min-h-[20px] rounded-lg transition-colors',
                snapshot.isDraggingOver && 'bg-primary/5'
              )}
            >
              <AnimatePresence mode="popLayout">
                {sortedSubtasks.map((subtask, index) => (
                  <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 transition-all',
                          subtask.completed && 'opacity-60',
                          snapshot.isDragging && 'shadow-lg ring-2 ring-primary/20 bg-card'
                        )}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-muted-foreground opacity-50 transition-opacity hover:opacity-100 active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>

                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={(checked) =>
                            onToggleSubtask(subtask.id, checked as boolean)
                          }
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
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-primary"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={handleCancelEdit}
                            >
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
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
