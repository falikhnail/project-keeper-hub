import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, Eye, Users, X, Mail, Crown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTeam, AppRole } from '@/hooks/useTeam';

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-amber-500' },
  member: { label: 'Member', icon: Users, color: 'text-primary' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-muted-foreground' },
};

interface TeamManagementProps {
  projectId: string;
  projectName: string;
}

export const TeamManagement = ({ projectId, projectName }: TeamManagementProps) => {
  const { members, invitations, loading, inviteMember, updateMemberRole, removeMember, cancelInvitation, isAdmin } = useTeam(projectId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    await inviteMember(inviteEmail.trim(), inviteRole, projectName);
    setInviteEmail('');
    setInviteRole('member');
    setIsInviting(false);
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Team ({members.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </DialogTitle>
        </DialogHeader>

        {/* Invite Section */}
        {isAdmin && (
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address..."
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={(v: AppRole) => setInviteRole(v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} size="icon">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <p className="text-sm font-medium text-muted-foreground">Members ({members.length})</p>
          <AnimatePresence>
            {members.map((member) => {
              const RoleIcon = roleConfig[member.role].icon;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(member.profile?.display_name, member.profile?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.profile?.display_name || member.profile?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.profile?.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <RoleIcon className={`h-3 w-3 ${roleConfig[member.role].color}`} />
                    {roleConfig[member.role].label}
                  </Badge>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                          <Crown className="h-4 w-4 mr-2 text-amber-500" /> Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'member')}>
                          <Users className="h-4 w-4 mr-2 text-primary" /> Set as Member
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" /> Set as Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => removeMember(member.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Invitations ({invitations.length})
            </p>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited as {roleConfig[inv.role]?.label || inv.role}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">Pending</Badge>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => cancelInvitation(inv.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {members.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No team members yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
