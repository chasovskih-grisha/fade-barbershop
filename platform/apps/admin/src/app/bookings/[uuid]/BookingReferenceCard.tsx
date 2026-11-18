'use client';

// Секція «Референс зачіски» картки візиту (REF-BARBER-01…04, T-043).
// Мініатюра → повний розмір за кліком (admin-screens §5.2), поруч коментар
// клієнта. Без референсу й без коментаря секція не рендериться (REF-BARBER-04).
//
// Рендер фото делеговано спільному `ReferenceThumb` — той самий компонент, що
// малює мініатюру в сітці календаря (REF-ADM-01), тож стани («Завантаження…»,
// «Фото недоступне», розгортання за кліком) описані в одному місці. Тут
// лишається тільки стан «Фото не прикріплене»: `ReferenceThumb` без
// referenceId не рендерить нічого, бо календарна картка сама ховає секцію.
import { Card } from '@fade/ui';
import { ReferenceThumb } from '../../components/ReferenceThumb';
import type { BookingDetail } from './booking-types';

// Реекспорт тримає імпорт типу живим: прибрати ReferenceThumb з модуля
// провалить компіляцію, а не лише runtime-перевірку.
export type { _BookingReferenceCardMustImportReferenceThumb } from '../../components/ReferenceThumb';

export function BookingReferenceCard({ detail }: { detail: BookingDetail }) {
  if (!detail.haircutReferenceId && !detail.comment) return null;

  return (
    <Card className="p-6">
      <h2 className="mb-3 font-display text-h4">Референс зачіски</h2>
      <div className="flex items-start gap-4">
        {detail.haircutReferenceId ? (
          <ReferenceThumb referenceId={detail.haircutReferenceId} />
        ) : (
          <span className="text-body text-fg-muted">Фото не прикріплене</span>
        )}
        {detail.comment ? <p className="flex-1 text-body">{detail.comment}</p> : null}
      </div>
    </Card>
  );
}
