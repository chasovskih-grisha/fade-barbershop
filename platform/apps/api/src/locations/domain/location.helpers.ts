// Helpers для агрегата Location: нормалізація введення.

import { Chair } from './chair';

export type PatchValue = string | number | null;

export function defaultChairs(): Chair[] {
  return [Chair.of(1, null, true), Chair.of(2, null, true)];
}

export function normalizeRequired(value: string, label: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${label} must not be empty`);
  return result;
}

export function normalizeCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!code) throw new Error('Code must not be empty');
  return code;
}

export function optionalTrimmed(value: string | undefined, current: string): string {
  if (value === undefined) return current;
  const result = value.trim();
  return result.length > 0 ? result : current;
}

export function optionalValue<T>(value: T | undefined, current: T): T {
  return value === undefined ? current : value;
}
