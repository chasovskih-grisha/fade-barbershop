import { resolveLocale, toDate } from './formatter-utils';

export function formatCurrency(amount: number, currency = 'UAH', locale = 'uk'): string {
  try {
    return new Intl.NumberFormat(resolveLocale(locale), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(
  dateStr: string | Date,
  locale = 'uk',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(dateStr);
  if (!date) return String(dateStr);
  return new Intl.DateTimeFormat(resolveLocale(locale), options || { dateStyle: 'medium' }).format(
    date
  );
}

export function formatTime(dateStr: string | Date, locale = 'uk', timeZone?: string): string {
  const date = toDate(dateStr);
  if (!date) return String(dateStr);
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    timeStyle: 'short',
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

export function formatDateTime(dateStr: string | Date, locale = 'uk'): string {
  const date = toDate(dateStr);
  if (!date) return String(dateStr);
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

export function formatRelativeTime(dateStr: string | Date, locale = 'uk'): string {
  const date = toDate(dateStr);
  if (!date) return String(dateStr);

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(resolveLocale(locale), { numeric: 'auto' });

  const absSeconds = Math.abs(diffInSeconds);
  if (absSeconds < 60) return rtf.format(diffInSeconds, 'seconds');
  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minutes');
  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hours');
  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) return rtf.format(diffInDays, 'days');
  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) return rtf.format(diffInMonths, 'months');
  return rtf.format(Math.round(diffInDays / 365), 'years');
}
