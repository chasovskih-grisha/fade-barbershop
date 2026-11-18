export function formatCurrency(amount: number, currency = 'UAH', locale = 'uk'): string {
  const localeMap: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    es: 'es-ES'
  };
  const resolvedLocale = localeMap[locale] || 'uk-UA';

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(dateStr: string | Date, locale = 'uk', options?: Intl.DateTimeFormatOptions): string {
  const localeMap: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    es: 'es-ES'
  };
  const resolvedLocale = localeMap[locale] || 'uk-UA';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

  if (isNaN(date.getTime())) {
    return String(dateStr);
  }

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    dateStyle: 'medium'
  };

  return new Intl.DateTimeFormat(resolvedLocale, defaultOptions).format(date);
}

export function formatTime(dateStr: string | Date, locale = 'uk', timeZone?: string): string {
  const localeMap: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    es: 'es-ES'
  };
  const resolvedLocale = localeMap[locale] || 'uk-UA';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

  if (isNaN(date.getTime())) {
    return String(dateStr);
  }

  const options: Intl.DateTimeFormatOptions = {
    timeStyle: 'short',
    ...(timeZone ? { timeZone } : {})
  };

  return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
}

export function formatDateTime(dateStr: string | Date, locale = 'uk'): string {
  const localeMap: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    es: 'es-ES'
  };
  const resolvedLocale = localeMap[locale] || 'uk-UA';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

  if (isNaN(date.getTime())) {
    return String(dateStr);
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date);
}

export function formatRelativeTime(dateStr: string | Date, locale = 'uk'): string {
  const localeMap: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    es: 'es-ES'
  };
  const resolvedLocale = localeMap[locale] || 'uk-UA';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

  if (isNaN(date.getTime())) {
    return String(dateStr);
  }

  const now = new Date();
  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(resolvedLocale, { numeric: 'auto' });

  const absSeconds = Math.abs(diffInSeconds);
  if (absSeconds < 60) {
    return rtf.format(diffInSeconds, 'seconds');
  }
  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minutes');
  }
  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hours');
  }
  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'days');
  }
  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'months');
  }
  const diffInYears = Math.round(diffInDays / 365);
  return rtf.format(diffInYears, 'years');
}
