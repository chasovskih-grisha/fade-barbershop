import { uuidv7 } from '@fade/domain-shared';

/** Адаптер сумісності: нові ідентифікатори завжди UUIDv7 (ADR 0021). */
export function v4(): string {
  return uuidv7();
}

/** Часово впорядкований ідентифікатор зі shared kernel. */
export function v7(): string {
  return uuidv7();
}

export const NIL = '00000000-0000-0000-0000-000000000000';
