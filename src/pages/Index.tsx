import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderGit2, Users, CheckCircle2, PauseCircle } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/project';
import { mockProjects } from '@/data/mockProjects';
import { ProjectCard } from '@/components/ProjectCard';
import { AddProjectDialog } from '@/components/AddProjectDialog';
import { StatsCard } from '@/components/StatsCard';
import { SearchFilter } from '@/components/SearchFilter';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ViewToggle, ViewMode } from '@/components/ViewToggle';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<ProjectStatus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { toast } = useToast();

  // Stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      handlers: [...new Set(projects.map((p) => p.lastHandler.email))].length,
    };
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.lastHandler.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.lastHandler.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(project.status);

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilters]);

  const handleStatusFilterChange = (status: ProjectStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilters([]);
  };

  const handleAddProject = (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingProject) {
      // Update existing project
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? { ...p, ...projectData, updatedAt: new Date() }
            : p
        )
      );
      toast({
        title: 'Project Updated',
        description: `${projectData.name} has been updated successfully.`,
      });
    } else {
      // Add new project
      const newProject: Project = {
        ...projectData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProjects((prev) => [newProject, ...prev]);
      toast({
        title: 'Project Added',
        description: `${projectData.name} has been added successfully.`,
      });
    }
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast({
      title: 'Project Deleted',
      description: `${project?.name} has been removed.`,
      variant: 'destructive',
    });
  };

  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              status: newStatus,
              updatedAt: new Date(),
              activities: [
                {
                  id: crypto.randomUUID(),
                  type: 'status_changed' as const,
                  description: `Status changed to ${newStatus}`,
                  handler: p.lastHandler,
                  timestamp: new Date(),
                  oldValue: p.status,
                  newValue: newStatus,
                },
                ...p.activities,
              ],
            }
          : p
      )
    );
    toast({
      title: 'Status Updated',
      description: `Project status changed to ${newStatus}.`,
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  useEffect(() => {
    if (editingProject) {
      setDialogOpen(true);
    }
  }, [editingProject]);

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <FolderGit2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Project Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Track your projects and team assignments
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Projects"
              value={stats.total}
              icon={FolderGit2}
              description="All time"
              index={0}
            />
            <StatsCard
              title="Active Projects"
              value={stats.active}
              icon={CheckCircle2}
              description="In progress"
              index={1}
            />
            <StatsCard
              title="Completed"
              value={stats.completed}
              icon={PauseCircle}
              description="Finished projects"
              index={2}
            />
            <StatsCard
              title="Team Members"
              value={stats.handlers}
              icon={Users}
              description="Active handlers"
              index={3}
            />
          </div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6"
          >
            <SearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilters={statusFilters}
              onStatusFilterChange={handleStatusFilterChange}
              onClearFilters={handleClearFilters}
            />
          </motion.div>

          {/* Projects View */}
          {viewMode === 'grid' ? (
            filteredProjects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16"
              >
                <FolderGit2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  No projects found
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchQuery || statusFilters.length > 0
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first project'}
                </p>
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </motion.div>
            )
          ) : (
            <KanbanBoard
              projects={filteredProjects}
              onStatusChange={handleStatusChange}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          )}
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <AddProjectDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onAdd={handleAddProject}
        editingProject={editingProject}
      />
    </div>
  );
};

export default Index;
