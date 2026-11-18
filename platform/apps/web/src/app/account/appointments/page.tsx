'use client';

import { useAppointmentsPage } from './useAppointmentsPage';
import { AlertBanner } from '@fade/ui';
import { AppointmentLists } from './AppointmentLists';
import { AppointmentModals } from './AppointmentModals';

export default function AppointmentsPage() {
  const page = useAppointmentsPage();

  const totalCount = page.upcoming.length + page.past.length;
  const statusAnnouncement = page.error
    ? `Помилка завантаження: ${page.error}`
    : page.loading
      ? 'Завантаження візитів...'
      : page.actionError
        ? `Помилка дії: ${page.actionError}`
        : `Завантажено візитів: ${totalCount} (майбутніх: ${page.upcoming.length}, минулих: ${page.past.length})`;

  if (page.authLoading || page.loading || page.error) {
    return (
      <div className="flex flex-col gap-8">
        <p role="status" aria-live="polite" className="sr-only">
          {statusAnnouncement}
        </p>
        <header>
          <h1 className="font-display text-h3">Мої візити</h1>
        </header>
        {page.error ? (
          <AlertBanner tone="error" title="Помилка">
            {page.error}
          </AlertBanner>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-blue border-t-transparent" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement}
      </p>
      <header>
        <h1 className="font-display text-h3">Мої візити</h1>
      </header>
      {page.actionError && !page.dialog ? (
        <AlertBanner tone="error" title="Помилка">
          {page.actionError}
        </AlertBanner>
      ) : null}
      <AppointmentLists upcoming={page.upcoming} past={page.past} cardProps={page.cardProps} />
      <AppointmentModals
        selected={page.selected}
        dialog={page.dialog}
        busy={page.busy}
        actionError={page.actionError}
        onClose={page.close}
        onCancel={page.confirmCancel}
        onReschedule={page.confirmReschedule}
        onReference={page.confirmReference}
      />
    </div>
  );
}
