const LOCALE_MAP: Record<string, string> = {
  uk: 'uk-UA',
  en: 'en-US',
  es: 'es-ES',
};

/** Resolves a short locale code to a full Intl locale (defaults to Ukrainian). */
export function resolveLocale(locale = 'uk'): string {
  return LOCALE_MAP[locale] || 'uk-UA';
}

/** Coerces a string or Date to a valid Date; returns null for invalid input. */
export function toDate(dateStr: string | Date): Date | null {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return Number.isNaN(date.getTime()) ? null : date;
}
