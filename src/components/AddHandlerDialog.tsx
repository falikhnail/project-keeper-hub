import { useState, useEffect } from 'react';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { Profile } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AddHandlerDialogProps {
  existingHandlerIds: string[];
  onAddHandler: (profileId: string) => Promise<void>;
  fetchAllProfiles: () => Promise<Profile[]>;
}

export const AddHandlerDialog = ({
  existingHandlerIds,
  onAddHandler,
  fetchAllProfiles,
}: AddHandlerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchAllProfiles()
        .then(setProfiles)
        .finally(() => setLoading(false));
    }
  }, [open, fetchAllProfiles]);

  const availableProfiles = profiles.filter(
    (p) =>
      !existingHandlerIds.includes(p.id) &&
      (p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (profileId: string) => {
    setAdding(profileId);
    await onAddHandler(profileId);
    setAdding(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Handler
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Handler</DialogTitle>
          <DialogDescription>
            Search and add a team member to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableProfiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? 'No matching users found' : 'No available users to add'}
            </p>
          ) : (
            availableProfiles.map((profile) => {
              const displayName = profile.display_name || profile.email || 'Unknown';
              const initials = displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-secondary text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      {profile.email && profile.display_name && (
                        <p className="text-xs text-muted-foreground">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(profile.id)}
                    disabled={adding === profile.id}
                  >
                    {adding === profile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
