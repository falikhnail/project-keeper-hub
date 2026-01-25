import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Users, 
  Activity,
  FolderGit2,
  Loader2,
  MessageSquare,
  ListTodo
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { HandlersList } from '@/components/HandlersList';
import { AddHandlerDialog } from '@/components/AddHandlerDialog';
import { CommentsSection } from '@/components/CommentsSection';
import { SubtasksList } from '@/components/SubtasksList';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  completed: { label: 'Completed', className: 'bg-primary/20 text-primary border-primary/30' },
  'on-hold': { label: 'On Hold', className: 'bg-warning/20 text-warning border-warning/30' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground border-border' },
};

const ProjectDetail = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { projects, loading, addHandler, removeHandler, fetchAllProfiles, addComment, deleteComment, updateComment, addSubtask, toggleSubtask, deleteSubtask, updateSubtask } = useProjects();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <FolderGit2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">Project Not Found</h1>
          <p className="mb-4 text-muted-foreground">The project doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[project.status];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative">
        <header className="border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 -ml-2 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={status.className}>{status.label}</Badge>
                    {project.tags?.map((tag) => (
                      <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{tag}</span>
                    ))}
                  </div>
                  <h1 className="mb-2 text-3xl font-bold text-foreground">{project.name}</h1>
                  <p className="max-w-2xl text-muted-foreground">{project.description}</p>
                </div>
                {project.link && (
                  <Button asChild>
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open Project
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><Calendar className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium text-foreground">{format(project.created_at, 'dd MMM yyyy', { locale: id })}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><Clock className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium text-foreground">{format(project.updated_at, 'dd MMM yyyy', { locale: id })}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><Users className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Handlers</p>
                  <p className="text-sm font-medium text-foreground">{project.all_handlers.length} people</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><Activity className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Activities</p>
                  <p className="text-sm font-medium text-foreground">{project.activities.length} events</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-8 lg:col-span-2">
              {/* Subtasks */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><ListTodo className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Subtasks</h2>
                    <p className="text-sm text-muted-foreground">
                      {(project.subtasks || []).filter(s => s.completed).length}/{(project.subtasks || []).length} completed
                    </p>
                  </div>
                </div>
                <SubtasksList
                  subtasks={(project.subtasks || []).map(s => ({
                    ...s,
                    created_by: s.created_by ? {
                      id: s.created_by.id,
                      display_name: s.created_by.display_name,
                      email: s.created_by.email,
                    } : null,
                  }))}
                  onAddSubtask={(title) => addSubtask(project.id, title)}
                  onToggleSubtask={toggleSubtask}
                  onDeleteSubtask={deleteSubtask}
                  onUpdateSubtask={updateSubtask}
                />
              </div>

              {/* Activity Timeline */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><Activity className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Activity Timeline</h2>
                    <p className="text-sm text-muted-foreground">Full project history</p>
                  </div>
                </div>
                <ActivityTimeline activities={project.activities} />
              </div>
            </motion.div>

            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Project Handlers</h2>
                        <p className="text-sm text-muted-foreground">Team members</p>
                      </div>
                    </div>
                    <AddHandlerDialog
                      existingHandlerIds={project.all_handlers.map((h) => h.id)}
                      onAddHandler={(profileId) => addHandler(project.id, profileId)}
                      fetchAllProfiles={fetchAllProfiles}
                    />
                  </div>
                  <HandlersList
                    handlers={project.all_handlers}
                    currentHandler={project.last_handler}
                    onRemoveHandler={(profileId) => removeHandler(project.id, profileId)}
                    canRemove
                  />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><MessageSquare className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Comments</h2>
                      <p className="text-sm text-muted-foreground">{project.comments.length} notes</p>
                    </div>
                  </div>
                  <CommentsSection
                    comments={project.comments}
                    currentUserProfileId={profile?.id}
                    onAddComment={(content, mentions, parentId) => addComment(project.id, content, mentions, parentId)}
                    onDeleteComment={deleteComment}
                    onUpdateComment={updateComment}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;
