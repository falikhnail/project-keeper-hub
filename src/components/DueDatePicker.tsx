import { useState } from 'react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface DueDatePickerProps {
  dueDate: Date | null;
  reminderDays: number;
  onDueDateChange: (date: Date | null) => void;
  onReminderDaysChange: (days: number) => void;
  readOnly?: boolean;
}

export const DueDatePicker = ({
  dueDate,
  reminderDays,
  onDueDateChange,
  onReminderDaysChange,
  readOnly = false,
}: DueDatePickerProps) => {
  const [open, setOpen] = useState(false);

  const getDueDateStatus = () => {
    if (!dueDate) return null;

    const daysUntilDue = differenceInDays(dueDate, new Date());

    if (isPast(dueDate) && !isToday(dueDate)) {
      return {
        label: 'Overdue',
        className: 'bg-destructive/20 text-destructive border-destructive/30',
        icon: AlertTriangle,
        daysText: `${Math.abs(daysUntilDue)} days overdue`,
      };
    }

    if (isToday(dueDate)) {
      return {
        label: 'Due Today',
        className: 'bg-warning/20 text-warning border-warning/30',
        icon: Clock,
        daysText: 'Due today!',
      };
    }

    if (daysUntilDue <= reminderDays) {
      return {
        label: 'Due Soon',
        className: 'bg-warning/20 text-warning border-warning/30',
        icon: Clock,
        daysText: `${daysUntilDue} days left`,
      };
    }

    return {
      label: 'On Track',
      className: 'bg-success/20 text-success border-success/30',
      icon: CheckCircle2,
      daysText: `${daysUntilDue} days left`,
    };
  };

  const status = getDueDateStatus();

  if (readOnly) {
    return (
      <div className="flex flex-col gap-2">
        {dueDate ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {format(dueDate, 'dd MMM yyyy', { locale: id })}
              </span>
            </div>
            {status && (
              <Badge variant="outline" className={cn('w-fit gap-1.5', status.className)}>
                <status.icon className="h-3 w-3" />
                {status.daysText}
              </Badge>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No due date set</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal sm:w-[200px]',
                !dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'dd MMM yyyy', { locale: id }) : 'Set due date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate || undefined}
              onSelect={(date) => {
                onDueDateChange(date || null);
                setOpen(false);
              }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
            {dueDate && (
              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    onDueDateChange(null);
                    setOpen(false);
                  }}
                >
                  Clear due date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {dueDate && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Remind</span>
            <Select
              value={reminderDays.toString()}
              onValueChange={(value) => onReminderDaysChange(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">7 days before</SelectItem>
                <SelectItem value="14">14 days before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {status && dueDate && (
        <Badge variant="outline" className={cn('gap-1.5', status.className)}>
          <status.icon className="h-3 w-3" />
          {status.daysText}
        </Badge>
      )}
    </div>
  );
};

export const DueDateBadge = ({ dueDate, reminderDays = 3 }: { dueDate: Date | null; reminderDays?: number }) => {
  if (!dueDate) return null;

  const daysUntilDue = differenceInDays(dueDate, new Date());

  if (isPast(dueDate) && !isToday(dueDate)) {
    return (
      <Badge variant="outline" className="gap-1 bg-destructive/20 text-destructive border-destructive/30">
        <AlertTriangle className="h-3 w-3" />
        Overdue
      </Badge>
    );
  }

  if (isToday(dueDate)) {
    return (
      <Badge variant="outline" className="gap-1 bg-warning/20 text-warning border-warning/30">
        <Clock className="h-3 w-3" />
        Due Today
      </Badge>
    );
  }

  if (daysUntilDue <= reminderDays) {
    return (
      <Badge variant="outline" className="gap-1 bg-warning/20 text-warning border-warning/30">
        <Clock className="h-3 w-3" />
        {daysUntilDue}d left
      </Badge>
    );
  }

  return null;
};
