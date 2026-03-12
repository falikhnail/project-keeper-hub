import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type AppRole = 'admin' | 'member' | 'viewer';

export interface TeamMember {
  id: string;
  profile_id: string;
  project_id: string;
  role: AppRole;
  created_at: Date;
  profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  email: string;
  project_id: string | null;
  role: AppRole;
  status: string;
  token: string;
  created_at: Date;
  expires_at: Date;
  invited_by: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export const useTeam = (projectId?: string) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          profile:profiles!project_members_profile_id_fkey(*)
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      setMembers(
        (data || []).map((m: any) => ({
          ...m,
          created_at: new Date(m.created_at),
          profile: m.profile,
        }))
      );
    } catch (err) {
      console.error('Error fetching members:', err);
    }
    setLoading(false);
  }, [projectId]);

  const fetchInvitations = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          invited_by_profile:profiles!team_invitations_invited_by_fkey(display_name, email)
        `)
        .eq('project_id', projectId)
        .eq('status', 'pending');

      if (error) throw error;

      setInvitations(
        (data || []).map((inv: any) => ({
          ...inv,
          created_at: new Date(inv.created_at),
          expires_at: new Date(inv.expires_at),
          invited_by: inv.invited_by_profile,
        }))
      );
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  const inviteMember = useCallback(
    async (email: string, role: AppRole = 'member', projectName?: string) => {
      if (!projectId || !user) return;

      try {
        const { data, error } = await supabase.functions.invoke('send-team-invitation', {
          body: { email, projectId, role, projectName },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast({
          title: data.autoAdded ? 'Member added' : 'Invitation sent',
          description: data.autoAdded
            ? `${email} has been added to the project`
            : `Invitation sent to ${email}`,
        });

        fetchMembers();
        fetchInvitations();
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    },
    [projectId, user, toast, fetchMembers, fetchInvitations]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, newRole: AppRole) => {
      try {
        const { error } = await supabase
          .from('project_members')
          .update({ role: newRole })
          .eq('id', memberId);

        if (error) throw error;

        toast({ title: 'Role updated' });
        fetchMembers();
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to update role',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchMembers]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      try {
        const { error } = await supabase
          .from('project_members')
          .delete()
          .eq('id', memberId);

        if (error) throw error;

        toast({ title: 'Member removed' });
        fetchMembers();
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to remove member',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchMembers]
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      try {
        const { error } = await supabase
          .from('team_invitations')
          .update({ status: 'expired' })
          .eq('id', invitationId);

        if (error) throw error;

        toast({ title: 'Invitation cancelled' });
        fetchInvitations();
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to cancel invitation',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchInvitations]
  );

  const currentUserRole = members.find(
    (m) => m.profile?.id === profile?.id
  )?.role;

  const isAdmin = currentUserRole === 'admin';

  return {
    members,
    invitations,
    loading,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    currentUserRole,
    isAdmin,
    refetch: () => {
      fetchMembers();
      fetchInvitations();
    },
  };
};
