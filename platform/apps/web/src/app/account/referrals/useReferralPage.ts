'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ReferralItem {
  id: string;
  maskedName: string;
  status: 'pending' | 'rewarded';
  createdAt: string;
  rewardEarned: number;
}

export interface ReferralData {
  code: string;
  shareUrl: string;
  earnedPoints: number;
  monthlyLimit: number;
  monthlyUsed: number;
  referrals: ReferralItem[];
}

export function useReferralPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
      setData({
        code: 'FADE-VIP-7749',
        shareUrl: 'https://fade.barbershop/book?ref=FADE-VIP-7749',
        earnedPoints: 300,
        monthlyLimit: 5,
        monthlyUsed: 2,
        referrals: [
          {
            id: 'ref-1',
            maskedName: 'Друг #1',
            status: 'rewarded',
            createdAt: '2026-11-01T10:00:00Z',
            rewardEarned: 150,
          },
          {
            id: 'ref-2',
            maskedName: 'Друг #2',
            status: 'pending',
            createdAt: '2026-11-08T14:30:00Z',
            rewardEarned: 150,
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити реферальні дані');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError('Не вдалося скопіювати посилання');
    }
  };

  const copyCode = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError('Не вдалося скопіювати код');
    }
  };

  const shareNative = async () => {
    if (!data) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'FADE Barbershop',
          text: 'Записуйся у найкращий барбершоп за моїм запрошенням і отримай знижку на перший візит!',
          url: data.shareUrl,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setShareError('Помилка при поширенні');
        }
      }
    } else {
      await copyLink();
    }
  };

  return {
    loading,
    error,
    data,
    copied,
    shareError,
    copyLink,
    copyCode,
    shareNative,
    retry: loadData,
  };
}
