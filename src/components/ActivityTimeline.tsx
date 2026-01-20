import { motion } from 'framer-motion';
import { 
  Plus, 
  RefreshCw, 
  ArrowRightLeft, 
  UserCheck, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { ProjectActivity } from '@/hooks/useProjects';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityTimelineProps {
  activities: ProjectActivity[];
}

type ActivityType = ProjectActivity['type'];

const activityConfig: Record<ActivityType, { icon: typeof Plus; color: string; bg: string }> = {
  created: { icon: Plus, color: 'text-success', bg: 'bg-success/20' },
  updated: { icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/20' },
  status_changed: { icon: ArrowRightLeft, color: 'text-warning', bg: 'bg-warning/20' },
  handler_changed: { icon: UserCheck, color: 'text-accent', bg: 'bg-accent/20' },
  comment: { icon: MessageSquare, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        const handlerName = activity.handler?.display_name || activity.handler?.email || 'Unknown';
        const initials = handlerName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative flex gap-4 pb-6"
          >
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-5 top-12 h-full w-px bg-border" />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {activity.description}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarFallback className="bg-secondary text-[10px] font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {handlerName}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground">•</span>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span title={format(activity.timestamp, 'PPpp', { locale: id })}>
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: id })}
                  </span>
                </div>
              </div>

              {/* Status change badges */}
              {activity.type === 'status_changed' && activity.old_value && activity.new_value && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                    {activity.old_value}
                  </span>
                  <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                  <span className="rounded-md bg-primary/20 px-2 py-0.5 text-primary">
                    {activity.new_value}
                  </span>
                </div>
              )}

              {/* Handler change */}
              {activity.type === 'handler_changed' && activity.old_value && activity.new_value && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                    {activity.old_value}
                  </span>
                  <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 text-accent">
                    {activity.new_value}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
