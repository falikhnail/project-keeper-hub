import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, User, Mail, Calendar, MoreHorizontal, Eye } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DueDateBadge } from '@/components/DueDatePicker';
import { ProjectCoverThumbnail } from '@/components/ProjectCoverImage';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
  compact?: boolean;
}

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  completed: { label: 'Completed', className: 'bg-primary/20 text-primary border-primary/30' },
  'on-hold': { label: 'On Hold', className: 'bg-warning/20 text-warning border-warning/30' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground border-border' },
};

export const ProjectCard = ({ 
  project, 
  index, 
  onEdit, 
  onDelete,
  isSelected = false,
  onSelectionChange,
  selectionMode = false,
  compact = false,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const status = statusConfig[project.status];
  const handler = project.last_handler;
  const initials = handler?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || handler?.email?.[0].toUpperCase() || '?';

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(project.id, checked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 blur transition-opacity duration-300",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )} />

      <div className={cn(
        "relative flex h-full flex-col rounded-xl border bg-card p-5 shadow-card transition-all duration-300",
        isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border group-hover:border-primary/30 group-hover:shadow-card-hover"
      )}>
        {/* Selection checkbox - visible on hover or in selection mode */}
        {onSelectionChange && (
          <div className={cn(
            "absolute left-3 top-3 z-10 transition-opacity",
            selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="h-5 w-5 border-2 bg-background"
            />
          </div>
        )}

        {/* Cover Image */}
        <ProjectCoverThumbnail
          coverImageUrl={project.cover_image_url}
          className="mb-4 aspect-video"
        />

        {/* Header */}
        <div className={cn("mb-4 flex items-start justify-between", onSelectionChange && "pl-8")}>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              <DueDateBadge dueDate={project.due_date} reminderDays={project.reminder_days} />
            </div>
            <h3 
              onClick={() => navigate(`/project/${project.id}`)}
              className="cursor-pointer text-lg font-semibold text-foreground transition-colors group-hover:text-primary hover:underline"
            >
              {project.name}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
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
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {project.description || 'No description'}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Link */}
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="truncate font-mono text-xs">{project.link}</span>
          </a>
        )}

        {/* Divider */}
        <div className="my-3 h-px bg-border" />

        {/* Last Handler */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{handler?.display_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{handler?.email || 'No email'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(project.updated_at, 'dd MMM yyyy', { locale: id })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
