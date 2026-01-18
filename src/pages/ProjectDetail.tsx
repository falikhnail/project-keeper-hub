import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Users, 
  Activity,
  FolderGit2
} from 'lucide-react';
import { mockProjects } from '@/data/mockProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { HandlersList } from '@/components/HandlersList';
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

  const project = mockProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <FolderGit2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">Project Not Found</h1>
          <p className="mb-4 text-muted-foreground">
            The project you're looking for doesn't exist.
          </p>
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
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                    {project.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {project.name}
                  </h1>
                  <p className="max-w-2xl text-muted-foreground">
                    {project.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button asChild>
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Project
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Meta info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(project.createdAt, 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(project.updatedAt, 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Handlers</p>
                  <p className="text-sm font-medium text-foreground">
                    {project.allHandlers.length} people
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Activities</p>
                  <p className="text-sm font-medium text-foreground">
                    {project.activities.length} events
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Activity Timeline
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Full project history and updates
                    </p>
                  </div>
                </div>

                <ActivityTimeline activities={project.activities} />
              </div>
            </motion.div>

            {/* Handlers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Project Handlers
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Everyone who worked on this project
                    </p>
                  </div>
                </div>

                <HandlersList
                  handlers={project.allHandlers}
                  currentHandler={project.lastHandler}
                />
              </div>

              {/* Project Link */}
              <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <h3 className="mb-3 text-sm font-medium text-foreground">Project Link</h3>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate font-mono text-xs">{project.link}</span>
                </a>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;
