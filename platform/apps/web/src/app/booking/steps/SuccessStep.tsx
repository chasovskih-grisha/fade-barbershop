'use client';

// Екран підтвердження запису (T-043, T-4735b, REF-WEB-03): показує візит, який
// щойно створено — локацію, послугу, майстра і час; референс і коментар лише
// тоді, коли вони є (їх відсутність не ховає ці факти). Жодних контролів, що
// вдають збереження вподобань, нагадування чи канал підтримки (T-4735).
// Кнопка календаря повернеться з T-4446 — з посиланням, у якому є початок і кінець.
import React from 'react';
import { Button } from '@fade/ui';
import { ReferenceThumbnail } from './ReferenceThumbnail';

interface Props {
  bookingId: string;
  locationName?: string | undefined;
  serviceName?: string | undefined;
  barberName?: string | undefined;
  time?: string | undefined;
  comment?: string | undefined;
  referencePhotoId?: string | null | undefined;
  referencePreview?: string | null | undefined;
}

export default function SuccessStep({
  bookingId,
  locationName,
  serviceName,
  barberName,
  time,
  comment,
  referencePhotoId,
  referencePreview,
}: Props) {
  const hasReference = Boolean(comment || referencePhotoId || referencePreview);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="font-display text-h4">Запис створено!</h2>
      <p className="text-fg-secondary">
        Номер запису: <strong className="text-fg">{bookingId}</strong>
      </p>

      {hasReference ? (
        <ReferenceThumbnail
          photoId={referencePhotoId ?? null}
          localPreview={referencePreview ?? null}
        />
      ) : null}

      <dl className="flex w-full max-w-sm flex-col gap-1 rounded-card border border-line bg-surface-raised p-4 text-left text-sm">
        <SummaryRow label="Локація" value={locationName} />
        <SummaryRow label="Послуга" value={serviceName} />
        <SummaryRow label="Майстер" value={barberName} />
        <SummaryRow label="Час" value={time} />
        {comment ? <SummaryRow label="Коментар" value={comment} /> : null}
      </dl>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => (window.location.href = '/account/appointments')}>Мої візити</Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          На головну
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-fg-secondary">{label}:</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}
