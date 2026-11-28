'use client';

// Дані сторінки барбера: власні візити + оплата на місці. Винесено з page.tsx,
// щоб сторінка лишалась у межах max-lines (поведінка не змінилась).
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { payBarberOnsite } from '@/lib/api/barber-onsite';
import type { ClientAppointmentView } from '@/lib/api/barber-appointments';

export function useBarberVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<ClientAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetch('/api/barber/own-visits', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }).then((r) => r.json());
      setVisits(data.visits);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося завантажити візити');
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [user, load]);

  return { user, visits, loading, error, reload: load };
}

export function useOnsitePayment(reload: () => Promise<void>) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payBusy, setPayBusy] = useState(false);

  const openPay = (bookingId: string) => {
    setPayingId(bookingId);
    setPayOpen(true);
  };

  const closePay = () => {
    setPayOpen(false);
    setPayingId(null);
  };

  const onPay = async (form: 'cash' | 'pos') => {
    if (!payingId) return;
    setPayBusy(true);
    try {
      await payBarberOnsite(payingId, form);
      closePay();
      await reload();
    } finally {
      // Помилку показує діалог — сторінка не дублює її банером.
      setPayBusy(false);
    }
  };

  return { payingId, payOpen, payBusy, openPay, closePay, onPay };
}
