// T-4867: маршрути майстрів і передача бабера в наявний флоу запису —
// в одному місці, щоб екран і тест не тримали власних копій рядків.

export function homeHref(): string {
  return '/';
}

export function barbersHref(): string {
  return '/(client)/barbers';
}

export function barberHref(id: string): string {
  return `${barbersHref()}/${encodeURIComponent(id)}`;
}

export function bookingHref(barberId: string) {
  return { pathname: '/(client)/booking' as const, params: { barberId } };
}
