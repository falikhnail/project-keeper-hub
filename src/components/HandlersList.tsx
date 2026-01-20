import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Crown, X, Loader2 } from 'lucide-react';
import { Profile } from '@/hooks/useProjects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface HandlersListProps {
  handlers: Profile[];
  currentHandler: Profile | null;
  onRemoveHandler?: (profileId: string) => Promise<void>;
  canRemove?: boolean;
}

export const HandlersList = ({
  handlers,
  currentHandler,
  onRemoveHandler,
  canRemove = false,
}: HandlersListProps) => {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (profileId: string) => {
    if (!onRemoveHandler) return;
    setRemoving(profileId);
    await onRemoveHandler(profileId);
    setRemoving(null);
  };

  return (
    <div className="space-y-3">
      {handlers.map((handler, index) => {
        const displayName = handler.display_name || handler.email || 'Unknown';
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const isCurrent = currentHandler && handler.id === currentHandler.id;
        const isOnlyHandler = handlers.length === 1;

        return (
          <motion.div
            key={handler.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`group relative flex items-center gap-3 rounded-lg border p-3 transition-all ${
              isCurrent
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            {/* Current indicator */}
            {isCurrent && (
              <div className="absolute -right-1 -top-1 rounded-full bg-primary p-1">
                <Crown className="h-3 w-3 text-primary-foreground" />
              </div>
            )}

            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-secondary text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {displayName}
                </span>
                {isCurrent && (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{handler.email}</span>
              </div>
            </div>

            {/* Remove button */}
            {canRemove && !isOnlyHandler && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemove(handler.id)}
                disabled={removing === handler.id}
                title="Remove handler"
              >
                {removing === handler.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                )}
              </Button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
