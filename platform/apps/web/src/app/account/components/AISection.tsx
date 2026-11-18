'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { UploadPhotoModal } from './UploadPhotoModal';
import { AICabinetBody } from './AICabinetBody';
import { useAiCabinetActions } from './useAiCabinetActions';

export function AISection() {
  const { user, token } = useAuth();
  const [data, setData] = useState<{
    photos: { id: string; url: string; consentGranted: boolean; createdAt: string }[];
    generations: {
      id: string;
      sourcePhotoId: string;
      status: 'pending' | 'processing' | 'ready' | 'failed';
      variants: { url: string; objectKey: string; contentType: string }[];
      failureReason?: string;
      errorMessage?: string;
      createdAt: string;
    }[];
    remainingToday: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/haircut-ai/assets', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load cabinet');
      setData(await res.json());
    } catch {
      setError('Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actions = useAiCabinetActions({
    fetchData,
    setError,
    setGeneratingId,
    setShowUpload,
  });

  if (!user) return null;
  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-blue border-t-transparent" />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="mb-4 text-danger">{error}</div>}
      <AICabinetBody
        data={data}
        generatingId={generatingId}
        onUpload={() => setShowUpload(true)}
        onGenerate={actions.handleGenerate}
        onConsent={actions.handleConsent}
        onDelete={actions.handleDeletePhoto}
        onSelectVariant={actions.handleSelectVariant}
      />
      <UploadPhotoModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onComplete={actions.handleUploadComplete}
      />
    </div>
  );
}
