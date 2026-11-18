'use client';

// Картка візиту (T-045, admin-screens §5.2): зведення + референс зачіски
// (мініатюра з коментарем, REF-ADM-01) + дії життєвого циклу
// (VisitActions → POST /admin/appointments/:id/*) + посилання на деталі
// (/bookings/[uuid]). Актор — сесія адміна; правила переходів валідує
// use case (409 на конфлікт).
import Link from 'next/link';
import { StatusPill, type VisitStatus } from '@fade/ui';
import { ReferenceThumb } from '../components/ReferenceThumb';

export type { _BookingReferenceCardMustImportReferenceThumb as _VisitCardMustImportReferenceThumb } from '../components/ReferenceThumb';
import VisitActions from './VisitActions';
import { useVisitCommand } from './useVisitCommand';
import { NEXT_ACTIONS, hhmm, type CalendarVisit } from './visit-status';

function VisitSummary({ visit }: { visit: CalendarVisit }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <StatusPill status={visit.status as VisitStatus} />
      <span className="text-body">{`${hhmm(visit.start)}–${hhmm(visit.end)}`}</span>
      {visit.agreedPrice !== null && <span className="text-body">{`${visit.agreedPrice} ₴`}</span>}
      <span className="text-caption text-fg-muted">
        {visit.clientId ? `клієнт ${visit.clientId.slice(0, 8)}` : `джерело: ${visit.source}`}
      </span>
    </div>
  );
}

/** Референс зачіски й коментар клієнта (REF-ADM-01). Без референсу й без
 *   коментаря секція просто відсутня (REF-BARBER-04-семантика).
 *   URL приходить із сітки календаря — картка не робить окремого запиту. */
function VisitReference({ visit }: { visit: CalendarVisit }) {
  if (!visit.haircutReferenceId && !visit.comment) return null;
  return (
    <div className="mt-3 flex items-start gap-3">
      <ReferenceThumb
        referenceId={visit.haircutReferenceId}
        presignedUrl={visit.referencePhotoUrl}
      />
      {visit.comment ? <p className="flex-1 text-body">{visit.comment}</p> : null}
    </div>
  );
}

export default function VisitCard(props: { visit: CalendarVisit; onDone: () => void }) {
  const { visit, onDone } = props;
  const { error, busy, post } = useVisitCommand(visit.id, onDone);
  const actions = NEXT_ACTIONS[visit.status] ?? [];
  const editable = visit.status === 'booked' || visit.status === 'confirmed';

  return (
    <div
      className="mt-3 rounded-card border border-line bg-surface-raised p-4"
      data-testid="visit-card"
    >
      <VisitSummary visit={visit} />
      <VisitReference visit={visit} />
      <Link
        href={`/bookings/${visit.bookingId}`}
        className="mt-2 inline-block text-body text-accent-blue hover:underline"
      >
        Деталі візиту
      </Link>
      {actions.length === 0 && !editable && (
        <p className="mt-2 text-caption text-fg-muted">
          Візит у термінальному статусі — дії недоступні
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2">
          {error}
        </p>
      )}
      {(actions.length > 0 || editable) && (
        <VisitActions actions={actions} busy={busy} post={post} />
      )}
    </div>
  );
}
