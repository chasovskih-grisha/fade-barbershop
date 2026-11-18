export type ClassValue = string | number | null | undefined | false;

/** Зливає класи, відкидаючи falsy — база variant-API дизайн-системи. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
