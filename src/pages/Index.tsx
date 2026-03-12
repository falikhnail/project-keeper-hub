import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderGit2, Users, CheckCircle2, PauseCircle, LogOut, Loader2, BarChart3, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, ProjectInput, Project } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectCard } from '@/components/ProjectCard';
import { AddProjectDialogDB } from '@/components/AddProjectDialogDB';
import { StatsCard } from '@/components/StatsCard';
import { SearchFilter } from '@/components/SearchFilter';
import { KanbanBoard } from '@/components/KanbanBoard';
import { CalendarView } from '@/components/CalendarView';
import { DraggableGridView } from '@/components/DraggableGridView';
import { ViewToggle, ViewMode } from '@/components/ViewToggle';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { OnboardingGuide } from '@/components/OnboardingGuide';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, signOut } = useAuth();
 const { projects, loading, addProject, updateProject, updateProjectStatus, bulkUpdateStatus, bulkDeleteProjects, deleteProject, addSubtask } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<ProjectStatus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [compactView, setCompactView] = useState(() => localStorage.getItem('pref_compact_view') === 'true');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });

  // Listen for compact view preference changes
  useEffect(() => {
    const handleStorage = () => {
      setCompactView(localStorage.getItem('pref_compact_view') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    // Also poll on focus for same-tab changes
    const handleFocus = () => handleStorage();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCompleteOnboarding = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  }, []);

  const handleSeedSampleData = useCallback(async () => {
    const sampleProjects: ProjectInput[] = [
      {
        name: 'Website Redesign',
        description: 'Redesign company website with modern UI/UX, improve mobile responsiveness and page load performance.',
        link: '',
        status: 'active',
        tags: ['design', 'frontend'],
        due_date: new Date(Date.now() + 14 * 86400000),
        reminder_days: 3,
      },
      {
        name: 'Mobile App MVP',
        description: 'Build the first version of the mobile app with core features: auth, dashboard, and notifications.',
        link: '',
        status: 'active',
        tags: ['mobile', 'mvp'],
        due_date: new Date(Date.now() + 30 * 86400000),
        reminder_days: 5,
      },
      {
        name: 'API Documentation',
        description: 'Write comprehensive API docs with examples, authentication guides, and rate limit info.',
        link: '',
        status: 'on-hold',
        tags: ['docs', 'backend'],
        due_date: new Date(Date.now() + 7 * 86400000),
        reminder_days: 2,
      },
      {
        name: 'Q4 Marketing Campaign',
        description: 'Plan and execute the Q4 digital marketing campaign across social media and email channels.',
        link: '',
        status: 'active',
        tags: ['marketing', 'campaign'],
        due_date: new Date(Date.now() + 21 * 86400000),
        reminder_days: 7,
      },
    ];

    for (const project of sampleProjects) {
      const projectId = await addProject(project);
      if (projectId) {
        // Add sample subtasks
        const subtasks = ['Research & planning', 'Design mockups', 'Implementation', 'Testing & QA'];
        for (const title of subtasks) {
          await addSubtask(projectId, title);
        }
      }
    }
  }, [addProject, addSubtask]);

  // Stats
  const stats = useMemo(() => {
    const uniqueHandlers = new Set<string>();
    projects.forEach((p) => {
      if (p.last_handler?.email) uniqueHandlers.add(p.last_handler.email);
    });
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      handlers: uniqueHandlers.size,
    };
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === '' ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.last_handler?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.last_handler?.email || '').toLowerCase().includes(searchQuery.toLowerCase());

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

   const handleAddProject = async (input: ProjectInput, initialSubtasks?: string[]) => {
    if (editingProject) {
      await updateProject(editingProject.id, input);
    } else {
       const projectId = await addProject(input);
       // Add initial subtasks from template if provided
       if (projectId && initialSubtasks && initialSubtasks.length > 0) {
         for (const title of initialSubtasks) {
           await addSubtask(projectId, title);
         }
       }
    }
    setEditingProject(null);
    setDialogOpen(false);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    await updateProjectStatus(projectId, newStatus);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  // Bulk selection handlers
  const handleSelectionChange = (projectId: string, selected: boolean) => {
    setSelectedProjectIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(projectId);
      } else {
        newSet.delete(projectId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedProjectIds(new Set());
  };

  const handleBulkStatusChange = async (status: ProjectStatus) => {
    await bulkUpdateStatus(Array.from(selectedProjectIds), status);
    setSelectedProjectIds(new Set());
  };

  const handleBulkDelete = async () => {
    await bulkDeleteProjects(Array.from(selectedProjectIds));
    setSelectedProjectIds(new Set());
  };

  const userInitials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile?.email?.[0].toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-border bg-card">
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
                <ThemeToggle />
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                <Button variant="outline" onClick={() => navigate('/analytics')} className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Avatar'} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.display_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Onboarding Guide for new users */}
          {showOnboarding && projects.length === 0 ? (
            <OnboardingGuide
              onComplete={handleCompleteOnboarding}
              onSeedSampleData={handleSeedSampleData}
            />
          ) : (
            <>
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
            className="mb-6 flex items-end gap-4"
          >
            <div className="flex-1">
              <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilters={statusFilters}
                onStatusFilterChange={handleStatusFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
            {viewMode === 'grid' && filteredProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedProjectIds.size === filteredProjects.length) {
                    setSelectedProjectIds(new Set());
                  } else {
                    setSelectedProjectIds(new Set(filteredProjects.map(p => p.id)));
                  }
                }}
                className="shrink-0 gap-2"
              >
                <Checkbox
                  checked={filteredProjects.length > 0 && selectedProjectIds.size === filteredProjects.length}
                  className="h-4 w-4 pointer-events-none"
                  tabIndex={-1}
                />
                {selectedProjectIds.size === filteredProjects.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </motion.div>

          {/* Projects View */}
          {viewMode === 'grid' ? (
            filteredProjects.length > 0 ? (
              <DraggableGridView
                projects={filteredProjects}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                selectedProjectIds={selectedProjectIds}
                onSelectionChange={handleSelectionChange}
                compact={compactView}
              />
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
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              projects={filteredProjects}
              onStatusChange={handleStatusChange}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ) : (
            <CalendarView
              projects={filteredProjects}
              onEdit={handleEditProject}
            />
          )}
            </>
          )}
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <AddProjectDialogDB
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleAddProject}
        editingProject={editingProject}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedProjectIds.size}
        onClearSelection={handleClearSelection}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
};

export default Index;
