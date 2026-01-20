import { motion } from 'framer-motion';
import { Mail, Crown } from 'lucide-react';
import { Profile } from '@/hooks/useProjects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HandlersListProps {
  handlers: Profile[];
  currentHandler: Profile | null;
}

export const HandlersList = ({ handlers, currentHandler }: HandlersListProps) => {
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

        return (
          <motion.div
            key={handler.email}
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
          </motion.div>
        );
      })}
    </div>
  );
};
