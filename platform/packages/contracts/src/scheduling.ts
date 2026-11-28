/**
 * Спільні контракти розкладу: причина скасування, яку пише рішення по конфлікту
 * недоступності барбера (T-4616a). Одне місце, бо те саме значення читають
 * API (скасування, push, кабінет), адмінка й мобільний клієнт — три різні
 * написання давали тихий розсинхрон (T-4616b).
 */
export const BARBER_UNAVAILABLE_CANCEL_REASON = 'barber unavailable';

/**
 * Чи причина скасування — «барбер недоступний». Порівняння терпиме до
 * регістру, пробілів і коду `BARBER_UNAVAILABLE`: у системі вже живуть обидва
 * написання (код рішення і причина візиту), і вони означають той самий факт.
 */
export function isBarberUnavailableReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return reason.trim().toLowerCase().replace(/_/g, ' ') === BARBER_UNAVAILABLE_CANCEL_REASON;
}

/**
 * Варіант тривалості послуги (T-4419): коротший/стандартний/довший з власною
 * поправкою до ціни локації. Слот будується від `duration` обраного варіанта,
 * а ціна запису — від ціни локації плюс `priceDelta`.
 */
export interface ServiceDurationVariant {
  label: string;
  duration: number;
  parallelDuration: number | null;
  priceDelta: number;
  description: string | null;
}

/** Послуга каталогу з варіантами тривалості; без них — стандартна тривалість. */
export interface ServiceWithDurationVariants {
  variants?: ServiceDurationVariant[] | null;
}

/** Необов'язковий вибір варіанта у запитах слотів і запису (T-4419). */
export interface DurationVariantSelection {
  variantLabel?: string;
}
