import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface ProjectActivity {
  id: string;
  type: 'created' | 'updated' | 'status_changed' | 'handler_changed' | 'comment';
  description: string;
  handler: Profile | null;
  timestamp: Date;
  old_value: string | null;
  new_value: string | null;
}

export interface ProjectComment {
  id: string;
  content: string;
  author: Profile | null;
  created_at: Date;
  updated_at: Date;
  parentCommentId: string | null;
  mentions: string[];
}

export interface ProjectSubtask {
  id: string;
  title: string;
  completed: boolean;
  order_position: number;
  created_by: Profile | null;
  created_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  tags: string[] | null;
  due_date: Date | null;
  reminder_days: number;
  created_by: Profile | null;
  last_handler: Profile | null;
  all_handlers: Profile[];
  activities: ProjectActivity[];
  comments: ProjectComment[];
  subtasks: ProjectSubtask[];
  created_at: Date;
  updated_at: Date;
}

export interface ProjectInput {
  name: string;
  description: string;
  link: string;
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  tags: string[];
  due_date?: Date | null;
  reminder_days?: number;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(*),
          last_handler_profile:profiles!projects_last_handler_id_fkey(*)
        `)
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;

      // For each project, fetch handlers and activities
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Fetch handlers
          const { data: handlersData } = await supabase
            .from('project_handlers')
            .select('profile_id, profiles(*)')
            .eq('project_id', project.id);

          // Fetch activities
          const { data: activitiesData } = await supabase
            .from('project_activities')
            .select('*, profiles(*)')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });

          // Fetch comments
          const { data: commentsData } = await supabase
            .from('project_comments')
            .select('*, profiles(*)')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });

          // Fetch subtasks
          const { data: subtasksData } = await supabase
            .from('project_subtasks')
            .select('*, profiles(*)')
            .eq('project_id', project.id)
            .order('order_position', { ascending: true });

          const handlers = handlersData?.map((h) => h.profiles as unknown as Profile) || [];
          const activities: ProjectActivity[] = (activitiesData || []).map((a) => ({
            id: a.id,
            type: a.type as ProjectActivity['type'],
            description: a.description,
            handler: a.profiles as unknown as Profile,
            timestamp: new Date(a.created_at),
            old_value: a.old_value,
            new_value: a.new_value,
          }));
          const comments: ProjectComment[] = (commentsData || []).map((c) => ({
            id: c.id,
            content: c.content,
            author: c.profiles as unknown as Profile,
            created_at: new Date(c.created_at),
            updated_at: new Date(c.updated_at),
            parentCommentId: (c as any).parent_comment_id || null,
            mentions: (c as any).mentions || [],
          }));
          const subtasks: ProjectSubtask[] = (subtasksData || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
            order_position: s.order_position,
            created_by: s.profiles as unknown as Profile,
            created_at: new Date(s.created_at),
          }));

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            link: project.link,
            status: project.status as Project['status'],
            tags: project.tags,
            due_date: project.due_date ? new Date(project.due_date) : null,
            reminder_days: project.reminder_days ?? 3,
            created_by: project.created_by_profile as unknown as Profile,
            last_handler: project.last_handler_profile as unknown as Profile,
            all_handlers: handlers,
            activities,
            comments,
            subtasks,
            created_at: new Date(project.created_at),
            updated_at: new Date(project.updated_at),
          };
        })
      );

      setProjects(projectsWithDetails);
    } catch (error: any) {
      toast({
        title: 'Error fetching projects',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();

    // Subscribe to realtime changes for projects, comments, and subtasks
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => fetchProjects()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_comments' },
        () => fetchProjects()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_subtasks' },
        () => fetchProjects()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  const addProject = async (input: ProjectInput) => {
    if (!profile) return;

    try {
      // Create project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: input.name,
          description: input.description,
          link: input.link,
          status: input.status,
          tags: input.tags,
          due_date: input.due_date?.toISOString() || null,
          reminder_days: input.reminder_days ?? 3,
          created_by: profile.id,
          last_handler_id: profile.id,
        } as any)
        .select()
        .single();

      if (projectError) throw projectError;

      // Add creator as handler
      await supabase.from('project_handlers').insert({
        project_id: newProject.id,
        profile_id: profile.id,
      });

      // Add activity
      await supabase.from('project_activities').insert({
        project_id: newProject.id,
        type: 'created',
        description: 'Project created',
        handler_id: profile.id,
      });

      toast({
        title: 'Project Added',
        description: `${input.name} has been added successfully.`,
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error adding project',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateProject = async (id: string, input: ProjectInput) => {
    if (!profile) return;

    try {
      const existingProject = projects.find((p) => p.id === id);
      
      const { error } = await supabase
        .from('projects')
        .update({
          name: input.name,
          description: input.description,
          link: input.link,
          status: input.status,
          tags: input.tags,
          due_date: input.due_date?.toISOString() || null,
          reminder_days: input.reminder_days ?? 3,
          last_handler_id: profile.id,
        } as any)
        .eq('id', id);

      if (error) throw error;

      // Add handler if not already
      await supabase.from('project_handlers').upsert(
        { project_id: id, profile_id: profile.id },
        { onConflict: 'project_id,profile_id' }
      );

      // Add activity
      await supabase.from('project_activities').insert({
        project_id: id,
        type: 'updated',
        description: 'Project updated',
        handler_id: profile.id,
      });

      // Check for status change
      if (existingProject && existingProject.status !== input.status) {
        await supabase.from('project_activities').insert({
          project_id: id,
          type: 'status_changed',
          description: `Status changed from ${existingProject.status} to ${input.status}`,
          handler_id: profile.id,
          old_value: existingProject.status,
          new_value: input.status,
        });
      }

      toast({
        title: 'Project Updated',
        description: `${input.name} has been updated successfully.`,
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error updating project',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateProjectStatus = async (id: string, newStatus: Project['status']) => {
    if (!profile) return;

    try {
      const existingProject = projects.find((p) => p.id === id);
      if (!existingProject) return;

      const { error } = await supabase
        .from('projects')
        .update({
          status: newStatus,
          last_handler_id: profile.id,
        })
        .eq('id', id);

      if (error) throw error;

      // Add handler if not already
      await supabase.from('project_handlers').upsert(
        { project_id: id, profile_id: profile.id },
        { onConflict: 'project_id,profile_id' }
      );

      // Add activity
      await supabase.from('project_activities').insert({
        project_id: id,
        type: 'status_changed',
        description: `Status changed from ${existingProject.status} to ${newStatus}`,
        handler_id: profile.id,
        old_value: existingProject.status,
        new_value: newStatus,
      });

      toast({
        title: 'Status Updated',
        description: `Project status changed to ${newStatus}.`,
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const project = projects.find((p) => p.id === id);
      
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Project Deleted',
        description: `${project?.name} has been removed.`,
        variant: 'destructive',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error deleting project',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addHandler = async (projectId: string, profileId: string) => {
    if (!profile) return;

    try {
      // Check if handler already exists
      const { data: existing } = await supabase
        .from('project_handlers')
        .select('id')
        .eq('project_id', projectId)
        .eq('profile_id', profileId)
        .single();

      if (existing) {
        toast({
          title: 'Handler already assigned',
          description: 'This user is already a handler for this project.',
          variant: 'destructive',
        });
        return;
      }

      // Get the profile being added
      const { data: handlerProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', profileId)
        .single();

      const { error } = await supabase.from('project_handlers').insert({
        project_id: projectId,
        profile_id: profileId,
      });

      if (error) throw error;

      // Add activity
      await supabase.from('project_activities').insert({
        project_id: projectId,
        type: 'handler_changed',
        description: `Added ${handlerProfile?.display_name || handlerProfile?.email} as handler`,
        handler_id: profile.id,
        new_value: handlerProfile?.display_name || handlerProfile?.email,
      });

      toast({
        title: 'Handler Added',
        description: `${handlerProfile?.display_name || handlerProfile?.email} has been added to the project.`,
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error adding handler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeHandler = async (projectId: string, profileId: string) => {
    if (!profile) return;

    try {
      // Get the profile being removed
      const { data: handlerProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', profileId)
        .single();

      const { error } = await supabase
        .from('project_handlers')
        .delete()
        .eq('project_id', projectId)
        .eq('profile_id', profileId);

      if (error) throw error;

      // Add activity
      await supabase.from('project_activities').insert({
        project_id: projectId,
        type: 'handler_changed',
        description: `Removed ${handlerProfile?.display_name || handlerProfile?.email} from handlers`,
        handler_id: profile.id,
        old_value: handlerProfile?.display_name || handlerProfile?.email,
      });

      toast({
        title: 'Handler Removed',
        description: `${handlerProfile?.display_name || handlerProfile?.email} has been removed from the project.`,
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error removing handler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      toast({
        title: 'Error fetching profiles',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
    return data || [];
  };

  const addComment = async (projectId: string, content: string, mentions: string[] = [], parentCommentId?: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId,
        author_id: profile.id,
        content: content.trim(),
        mentions,
        parent_comment_id: parentCommentId || null,
      } as any);

      if (error) throw error;

      // Also add activity
      await supabase.from('project_activities').insert({
        project_id: projectId,
        type: 'comment',
        description: parentCommentId ? 'Replied to a comment' : 'Added a comment',
        handler_id: profile.id,
      });

      toast({
        title: parentCommentId ? 'Reply Added' : 'Comment Added',
        description: parentCommentId ? 'Your reply has been posted.' : 'Your comment has been posted.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error adding comment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Comment Deleted',
        description: 'Your comment has been removed.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error deleting comment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateComment = async (commentId: string, content: string, mentions: string[] = []) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .update({ content: content.trim(), mentions } as any)
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Comment Updated',
        description: 'Your comment has been updated.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error updating comment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Subtask functions
  const addSubtask = async (projectId: string, title: string) => {
    if (!profile) return;

    try {
      const project = projects.find((p) => p.id === projectId);
      const maxOrder = Math.max(0, ...(project?.subtasks?.map((s) => s.order_position) || [0]));

      const { error } = await supabase.from('project_subtasks').insert({
        project_id: projectId,
        title,
        created_by: profile.id,
        order_position: maxOrder + 1,
      } as any);

      if (error) throw error;

      toast({
        title: 'Subtask Added',
        description: 'New subtask has been added.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error adding subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('project_subtasks')
        .update({ completed } as any)
        .eq('id', subtaskId);

      if (error) throw error;

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error updating subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('project_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      toast({
        title: 'Subtask Deleted',
        description: 'Subtask has been removed.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error deleting subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateSubtask = async (subtaskId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('project_subtasks')
        .update({ title } as any)
        .eq('id', subtaskId);

      if (error) throw error;

      toast({
        title: 'Subtask Updated',
        description: 'Subtask has been updated.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error updating subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    addHandler,
    removeHandler,
    fetchAllProfiles,
    addComment,
    deleteComment,
    updateComment,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtask,
    refetch: fetchProjects,
  };
};
