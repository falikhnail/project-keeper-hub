import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ExternalLink, User, GripVertical, MoreHorizontal, Eye } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

interface KanbanBoardProps {
  projects: Project[];
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

const columns: { id: ProjectStatus; title: string; color: string }[] = [
  { id: 'active', title: 'Active', color: 'bg-success' },
  { id: 'on-hold', title: 'On Hold', color: 'bg-warning' },
  { id: 'completed', title: 'Completed', color: 'bg-primary' },
  { id: 'archived', title: 'Archived', color: 'bg-muted-foreground' },
];

const KanbanCard = ({
  project,
  index,
  onEdit,
  onDelete,
}: {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const handler = project.last_handler;
  const initials = handler?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || handler?.email?.[0].toUpperCase() || '?';

  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative mb-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 ${
            snapshot.isDragging
              ? 'scale-[1.02] rotate-[1deg] shadow-xl ring-2 ring-primary/30 z-50'
              : 'hover:border-primary/30 hover:shadow-md'
          }`}
          style={{
            transition: snapshot.isDragging
              ? 'box-shadow 0.2s ease, transform 0.2s ease'
              : 'all 0.2s ease',
          }}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="pl-4">
            {/* Header */}
            <div className="mb-2 flex items-start justify-between">
              <h4
                onClick={() => navigate(`/project/${project.id}`)}
                className="cursor-pointer text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
              >
                {project.name}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/project/${project.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(project)}>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(project.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
              {project.description || 'No description'}
            </p>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {project.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 2 && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    +{project.tags.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Link */}
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex items-center gap-1.5 text-xs text-primary transition-colors hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate font-mono text-[10px]">{project.link}</span>
              </a>
            )}

            {/* Handler */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarFallback className="bg-secondary text-[10px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{handler?.display_name || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export const KanbanBoard = ({
  projects,
  onStatusChange,
  onEdit,
  onDelete,
}: KanbanBoardProps) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as ProjectStatus;
    const destinationStatus = result.destination.droppableId as ProjectStatus;

    if (sourceStatus !== destinationStatus) {
      onStatusChange(result.draggableId, destinationStatus);
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter((p) => p.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((column, columnIndex) => {
          const columnProjects = getProjectsByStatus(column.id);

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: columnIndex * 0.1 }}
              className="flex flex-col"
            >
              {/* Column Header */}
              <div className="mb-4 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnProjects.length}
                </Badge>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-xl border-2 border-dashed p-3 transition-all duration-300 ${
                      snapshot.isDraggingOver
                        ? 'border-primary bg-primary/5 scale-[1.01] shadow-inner'
                        : 'border-border bg-card/30'
                    }`}
                    style={{ minHeight: '400px' }}
                  >
                    <ScrollArea className="h-[400px]">
                      {columnProjects.map((project, index) => (
                        <KanbanCard
                          key={project.id}
                          project={project}
                          index={index}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                      {provided.placeholder}
                      {columnProjects.length === 0 && (
                        <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                          Drop projects here
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </Droppable>
            </motion.div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
