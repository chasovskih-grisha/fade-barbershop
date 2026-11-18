'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ClientDetail, ClientTab } from './client-types';
import { patchVip } from './client-api';
import { useClientNotes } from './use-client-notes';

export function useClientDetail() {
  const clientId = useParams().id as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ClientTab>('profile');
  const [vipDiscount, setVipDiscount] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/admin/clients/${clientId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load client');
        const data = await res.json();
        setClient(data);
        setVipDiscount(data.vipDiscountPercent ?? null);
      } catch {
        setError('Не вдалося завантажити клієнта');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  const handleSaveVipDiscount = async () => {
    if (!client) return;
    setSaving(true);
    try {
      await patchVip(client.id, vipDiscount);
      setClient((c) => (c ? { ...c, vipDiscountPercent: vipDiscount } : null));
    } catch {
      alert('Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  // Нотатки — окремий хук (SRP): модалка + add/remove, saving спільний.
  const notes = useClientNotes(client, setClient, setSaving);

  return {
    client,
    loading,
    error,
    saving,
    activeTab,
    setActiveTab,
    vipDiscount,
    setVipDiscount,
    handleSaveVipDiscount,
    ...notes,
  };
}
