'use client';

import type { ClientSessionChannel } from '@fade/contracts';
import { useClientSessions } from './devices/useClientSessions';

export type ThisDevice = {
  /** Канал поточної сесії; null — список не завантажено або впав. */
  channel: ClientSessionChannel | null;
  /** Інші пристрої; null — лічильник показувати не можна (T-4724). */
  others: number | null;
};

/** Рядок «Цей пристрій» (T-4724b): читає той самий список, що екран «Пристрої». */
export function useThisDevice(): ThisDevice {
  const { sessions, loading, error } = useClientSessions();
  const current = sessions.find((session) => session.current);

  if (error) return { channel: null, others: null };

  return {
    channel: current?.channel ?? null,
    others: loading ? null : sessions.filter((session) => !session.current).length,
  };
}
