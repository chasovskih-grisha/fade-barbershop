import { cn } from './cn';
import { StatusPill } from './StatusPill';
import type { VisitStatus } from './StatusPill';

export interface CalendarVisit {
  id: string;
  time: string;
  status: VisitStatus;
}

export interface CalendarDayProps {
  label: string;
  dateLabel?: string | undefined;
  isToday?: boolean | undefined;
  visits?: CalendarVisit[] | undefined;
  onSelect?: (() => void) | undefined;
  className?: string | undefined;
}

export function CalendarDay({
  label,
  dateLabel,
  isToday = false,
  visits = [],
  onSelect,
  className,
}: CalendarDayProps) {
  const classes = cn(
    'flex min-h-24 flex-col gap-1 rounded-card border p-2 text-left bg-surface-sunken',
    isToday ? 'border-line-strong' : 'border-line',
    onSelect &&
      'hover:bg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
    className
  );
  const content = (
    <>
      <span className="flex items-center justify-between text-caption">
        <span className="text-fg-secondary">{label}</span>
        {dateLabel ? (
          <span className={isToday ? 'text-fg' : 'text-fg-muted'}>{dateLabel}</span>
        ) : null}
      </span>
      {visits.map((visit) => (
        <span key={visit.id} className="flex items-center gap-1 text-caption text-fg-muted">
          <span className="tabular-nums">{visit.time}</span>
          <StatusPill status={visit.status} />
        </span>
      ))}
    </>
  );
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={classes}>
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}

export interface CalendarWeekProps {
  days: CalendarDayProps[];
  className?: string;
}

export function CalendarWeek({ days, className }: CalendarWeekProps) {
  return (
    <div className={cn('grid grid-cols-7 gap-2', className)}>
      {days.map((day) => (
        <CalendarDay key={day.label} {...day} />
      ))}
    </div>
  );
}
