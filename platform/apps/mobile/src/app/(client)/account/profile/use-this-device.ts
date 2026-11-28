import { useEffect, useState } from 'react';
import type { ClientSessionChannel } from '@fade/contracts';
import { getClientSessions } from '../../../../lib/api/client-sessions';

export type ThisDevice = {
  /** Канал поточної сесії; null — список не завантажено або впав. */
  channel: ClientSessionChannel | null;
  /** Інші пристрої; null — лічильник показувати не можна (T-4724). */
  others: number | null;
};

const NOT_LOADED: ThisDevice = { channel: null, others: null };

/** Рядок «Цей пристрій» (T-4724c): читає той самий список, що екран «Пристрої». */
export function useThisDevice(): ThisDevice {
  const [device, setDevice] = useState<ThisDevice>(NOT_LOADED);

  useEffect(() => {
    let mounted = true;
    getClientSessions()
      .then((sessions) => {
        if (!mounted) return;
        const current = sessions.find((session) => session.current);
        setDevice({
          channel: current?.channel ?? null,
          others: sessions.filter((session) => !session.current).length,
        });
      })
      .catch(() => {
        if (mounted) setDevice(NOT_LOADED);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return device;
}
