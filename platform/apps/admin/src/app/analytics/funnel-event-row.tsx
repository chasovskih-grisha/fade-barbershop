import type { FunnelTelemetryEvent } from './funnel-telemetry';

type StatusStyle = { dot: string; badge: string; label: string };

const STATUS_STYLES: Record<FunnelTelemetryEvent['status'], StatusStyle> = {
  success: {
    dot: 'bg-semantic-success',
    badge: 'bg-semantic-success/10 text-semantic-success',
    label: 'Успіх',
  },
  abandoned: {
    dot: 'bg-semantic-danger',
    badge: 'bg-semantic-danger/10 text-semantic-danger',
    label: 'Кинуто кошик',
  },
  'step-completed': {
    dot: 'bg-accent',
    badge: 'bg-accent/10 text-accent',
    label: 'Крок пройдено',
  },
};

export default function FunnelEventRow({ event }: { event: FunnelTelemetryEvent }) {
  const style = STATUS_STYLES[event.status];

  return (
    <div className="p-3 rounded-input border border-line bg-surface flex items-center justify-between text-body">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        <div className="flex flex-col">
          <span className="font-semibold text-fg">{event.stepName}</span>
          <span className="text-caption text-fg-muted">
            {event.clientName} • {event.locationName}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-0.5 rounded-pill text-caption font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <span className="text-caption text-fg-secondary">{event.timestamp}</span>
      </div>
    </div>
  );
}
