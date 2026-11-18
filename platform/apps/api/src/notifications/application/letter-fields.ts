// Спільні поля листів: час візиту (Europe/Kyiv, ADR 0001) і безпечні посилання.
// Тексти листів тут не живуть — вони в templates/*.liquid.

export interface LetterField {
  label: string;
  value: string;
}

export function formatWhen(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Kyiv',
  }).format(date);
}

export function whereLine(name: string | undefined, address: string | undefined): string {
  const parts: string[] = [];
  if (name) parts.push(name);
  if (address) parts.push(address);
  return parts.join(', ');
}

/** Лише http(s). javascript: і биті рядки в href не потрапляють. */
export function httpUrl(value: string | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return value;
  } catch {
    return '';
  }
}

export function toLetterRows(lines: readonly (readonly [string, string])[]): LetterField[] {
  return lines.map(([label, value]) => ({ label, value }));
}
