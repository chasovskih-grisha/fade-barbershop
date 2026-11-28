// Клієнт звичної локації і барбера (T-4725c). Окремий модуль, бо identity.ts
// уже впирався в межу 100 рядків (max-lines), а тут — самостійна пара
// «тип + один PATCH». Імпортери беруть його як і раніше з identity.ts:
// там лишився реекспорт.
import { apiBase } from './api-base';

/** Звична локація і барбер. Порожнє — реальний вибір «Не обрано». */
export interface UsualChair {
  locationId: string | null;
  barberId: string | null;
}

/** PATCH звичної пари: `null` у полі очищає саме його, відсутнє — не чіпає. */
export async function updateProfileUsualChair(chair: UsualChair): Promise<UsualChair> {
  const res = await fetch(`${apiBase()}/identity/profile/usual-chair`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(chair),
  });
  if (!res.ok) throw new Error('Failed to update usual chair');
  const body = (await res.json()) as { usualChair?: UsualChair | null };
  return body.usualChair ?? { locationId: null, barberId: null };
}
