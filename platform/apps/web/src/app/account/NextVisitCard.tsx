'use client';

import Link from 'next/link';
import { Badge, Card } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { ActionLink } from '@/app/components/ActionLink';
import {
  depositHoldNote,
  depositHoldView,
  depositResumeHref,
} from './appointments/deposit-summary';
import { formatVisitWhen, formatVisitWhere, waitingForDeposit } from './next-visit';

/**
 * Картка «Найближчий візит» на профілі (T-4716, web-cabinet-screens §2).
 * Показує найближчий майбутній візит і веде на сторінку візитів; дій тут
 * немає — перенос, референс і оплата лишаються на сторінці візитів.
 */
export function NextVisitCard({ visit }: { visit: ExtendedAppointment | null }) {
  if (!visit) {
    return (
      <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-display">Найближчий візит</h2>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-body text-fg-secondary">Немає найближчого візиту</p>
          <ActionLink href="/booking" variant="secondary" className="w-fit">
            Записатися
          </ActionLink>
        </div>
      </Card>
    );
  }

  const now = new Date();
  const holdState = depositHoldView(visit, now);
  const holdNote = depositHoldNote(visit, now);
  const resumeHref = depositResumeHref(visit, now);

  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-display">Найближчий візит</h2>
        {waitingForDeposit(visit) ? (
          <Badge tone="warning">Очікує депозиту</Badge>
        ) : holdState === 'released' ? (
          <Badge tone="neutral">Крісло звільнено</Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-text text-bodyLg font-medium text-fg">{formatVisitWhen(visit)}</p>
        <p className="text-body text-fg-secondary">{formatVisitWhere(visit)}</p>
        {holdNote ? <p className="text-body-s text-fg-secondary">{holdNote}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {resumeHref ? (
          <ActionLink href={resumeHref} className="h-10 px-4 text-body">
            Оплатити депозит
          </ActionLink>
        ) : null}
        <Link
          href="/account/appointments"
          className="w-fit font-text text-body text-accent-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          Деталі
        </Link>
      </div>
    </Card>
  );
}
