// Секція «Про візит»: ідентифікатори, ціна, режим, джерело, коментар.
// Рядки будуємо окремо від розкладки — щоб компонент лишався простим
// (complexity-гейт) і читався як макет сторінки. ID показуємо повністю:
// картка існує насамперед для підтримки по конкретному запису.
'use client';

import { Card } from '@fade/ui';
import { money } from './booking-format';
import { FULFILLMENT_LABELS, PARTY_ROLE_LABELS, SOURCE_LABELS } from './booking-labels';
import type { BookingDetail } from './booking-types';

const dash = (value: string | null | undefined) => value ?? '—';
const labeled = (labels: Record<string, string>, value: string | null) =>
  value ? (labels[value] ?? value) : '—';

function rows(detail: BookingDetail): [string, string][] {
  return [
    ['ID запису', detail.id],
    ['ID візиту', dash(detail.appointmentId)],
    ['Послуга', dash(detail.service?.name)],
    // Зафіксована тривалість візиту (`end − start`), не поточна з каталогу:
    // зміна тривалості послуги не рухає вже створений візит (T-4618b).
    ['Тривалість послуги', `${detail.durationMinutes} хв`],
    ['Ціна', detail.agreedPrice !== null ? money(detail.agreedPrice) : '—'],
    ['Джерело', labeled(SOURCE_LABELS, detail.source)],
    ['Режим', labeled(FULFILLMENT_LABELS, detail.fulfillmentMode)],
    ['Роль у партії', labeled(PARTY_ROLE_LABELS, detail.partyRole)],
    ['Версія', String(detail.version)],
  ];
}

const isUuid = (value: string) => value.length === 36;

export function BookingSummaryCard({ detail }: { detail: BookingDetail }) {
  return (
    <Card className="p-6">
      <h2 className="mb-3 font-display text-h4">Про візит</h2>
      <dl className="divide-y divide-line">
        {rows(detail).map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-1">
            <dt className="shrink-0 text-caption text-fg-muted">{label}</dt>
            <dd
              className={`text-right text-body text-fg ${isUuid(value) ? 'break-all font-mono text-body' : ''}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {detail.cancelReason && (
        <p className="mt-3 text-body text-semantic-danger">
          {`Причина скасування: ${detail.cancelReason}`}
        </p>
      )}
    </Card>
  );
}
