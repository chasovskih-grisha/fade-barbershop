'use client';

// T-4446b: посилання «Додати в календар» на картці візиту. Час береться з
// серверних ISO-моментів (startsAt/endsAt), а не з локального стану, тож після
// перенесення посилання веде на новий час. Скасований візит посилань не має.
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { googleCalendarUrl, icsDownloadPath } from '@/lib/calendar-links';

export function AddToCalendar({ app }: { app: ExtendedAppointment }) {
  if (app.status === 'cancelled') return null;
  if (!app.startsAt || !app.endsAt) return null;

  const google = googleCalendarUrl({
    title: `FADE · ${app.serviceName}`,
    start: app.startsAt,
    end: app.endsAt,
    location: app.locationName,
    details: `${app.serviceName} · ${app.barberName}`,
  });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-body-s">
      <span className="text-fg-secondary">Додати в календар:</span>
      <a
        href={icsDownloadPath(app.id)}
        download
        className="text-fg underline underline-offset-2 hover:text-fg-secondary"
      >
        .ics
      </a>
      {google ? (
        <a
          href={google}
          target="_blank"
          rel="noreferrer"
          className="text-fg underline underline-offset-2 hover:text-fg-secondary"
        >
          Google
        </a>
      ) : null}
    </div>
  );
}
