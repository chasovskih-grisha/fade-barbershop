'use client';

// Профіль верифікованого клієнта для форми візиту (T-046): щоб адмін бачив, кому
// записує, а не лише номер. Джерело — CRM за User.id, який прийшов із OTP
// (`GET /admin/clients/by-user/:userId`), а не за ClientProfile.id.
//
// Помилка **не блокує** створення візиту: картка інформаційна. Тому стан
// 'error' показує рядок із повтором, а не AlertBanner на всю форму.

import { useCallback, useEffect, useState } from 'react';

export type VerifiedClient = {
  name: string | null;
  phone: string;
  vipDiscountPercent: number | null;
  loyaltyVisitsCount: number;
};

export type VerifiedClientState = 'loading' | 'ready' | 'error';

export function useVerifiedClient(clientId: string) {
  const [client, setClient] = useState<VerifiedClient | null>(null);
  const [state, setState] = useState<VerifiedClientState>('loading');

  const load = useCallback(async () => {
    if (!clientId) return;
    setState('loading');
    try {
      const res = await fetch(`/admin/clients/by-user/${encodeURIComponent(clientId)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as VerifiedClient;
      setClient({
        name: body.name ?? null,
        phone: body.phone,
        vipDiscountPercent: body.vipDiscountPercent ?? null,
        loyaltyVisitsCount: body.loyaltyVisitsCount ?? 0,
      });
      setState('ready');
    } catch {
      setClient(null);
      setState('error');
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { client, state, load };
}
