import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/ProjectCard';

interface DraggableGridViewProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  selectedProjectIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
  compact?: boolean;
}

export const DraggableGridView = ({
  projects,
  onEdit,
  onDelete,
  selectedProjectIds,
  onSelectionChange,
  compact = false,
}: DraggableGridViewProps) => {
  const [orderedProjects, setOrderedProjects] = useState<Project[]>(projects);

  useEffect(() => {
    setOrderedProjects(projects);
  }, [projects]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(orderedProjects);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setOrderedProjects(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="grid" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`grid sm:grid-cols-2 ${compact ? 'gap-2 lg:grid-cols-4' : 'gap-4 lg:grid-cols-3'}`}
          >
            <AnimatePresence mode="popLayout">
              {orderedProjects.map((project, index) => (
                <Draggable key={project.id} draggableId={project.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`relative transition-shadow duration-200 ${
                        snapshot.isDragging
                          ? 'z-50 rounded-xl shadow-lg ring-2 ring-primary/20'
                          : ''
                      }`}
                      style={{
                        ...dragProvided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.92 : 1,
                      }}
                    >
                      {/* Drag handle overlay */}
                      <div
                        {...dragProvided.dragHandleProps}
                        className="absolute right-3 top-3 z-20 cursor-grab rounded-md p-1 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100 [div:hover>&]:opacity-100"
                        style={{ opacity: snapshot.isDragging ? 1 : undefined }}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <ProjectCard
                        project={project}
                        index={0}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isSelected={selectedProjectIds.has(project.id)}
                        onSelectionChange={onSelectionChange}
                        selectionMode={selectedProjectIds.size > 0}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </AnimatePresence>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
