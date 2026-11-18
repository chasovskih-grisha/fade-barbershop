// Спільні чисті хелпери для сервісів, що не мають власного модуля.
import { createHash } from 'node:crypto';

/**
 * Стабільна контрольна сума для idempotency-перевірок та журналів.
 * Порядок частин важливий: той самий набір даних дає той самий хеш.
 */
export function calculateChecksum(...parts: Array<string | number | null | undefined>): string {
  const payload = parts.map((part) => (part ?? '').toString()).join(':');
  return createHash('sha256').update(payload).digest('hex');
}
