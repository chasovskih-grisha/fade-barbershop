// Куди веде контроль акаунта шапки (T-4715a): публічна контентна сторінка
// передає next, щоб логін повернув на неї. `/booking` і `/account` — ні:
// чернетка запису живе в стані клієнта, а повернення на порожній флоу
// заплутує. Логін і без next веде на `/account/appointments`.

const PUBLIC_PREFIXES = ['/locations', '/services', '/barbers', '/blog'] as const;

export function isPublicContentPath(pathname: string | null | undefined): pathname is string {
  if (!pathname) return false;
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function accountHref(pathname: string | null | undefined): string {
  return isPublicContentPath(pathname) ? `/login?next=${encodeURIComponent(pathname)}` : '/login';
}
