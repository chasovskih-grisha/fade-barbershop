'use client';

import { useEffect } from 'react';
import { Button } from '@fade/ui';

export type GenerationView = {
  id: string;
  sourcePhotoId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  variants: { url: string; objectKey: string; contentType: string }[];
  failureReason?: string;
  errorMessage?: string;
  createdAt: string;
};

export const badgeColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-semantic-danger/15 text-red-800',
};

export const statusLabels = {
  pending: 'Чекає',
  processing: 'Обробка',
  ready: 'Готово',
  failed: 'Помилка',
};

export function useGenerationPoll(generation: GenerationView) {
  useEffect(() => {
    if (generation.status !== 'pending' && generation.status !== 'processing') return;
    const timer = setInterval(() => {
      fetch(`/haircut-ai/generations/${generation.id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'ready' || data.status === 'failed') window.location.reload();
        });
    }, 3000);
    return () => clearInterval(timer);
  }, [generation.id, generation.status]);
}

export function GenerationHeader({
  status,
  createdAt,
}: {
  status: GenerationView['status'];
  createdAt: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className={`px-2 py-1 rounded-full text-xs ${badgeColors[status]}`}>
        {statusLabels[status]}
      </span>
      <span className="text-xs text-fg-muted">{new Date(createdAt).toLocaleString('uk-UA')}</span>
    </div>
  );
}

export function FailedGeneration({
  generation,
  onDelete,
}: {
  generation: GenerationView;
  onDelete: (photoId: string) => void;
}) {
  return (
    <div className="rounded-card border border-line bg-surface-raised p-4">
      <GenerationHeader status="failed" createdAt={generation.createdAt} />
      <p className="text-body-s text-fg-secondary mb-2">
        Причина: {generation.failureReason} — {generation.errorMessage}
      </p>
      <Button variant="ghost" size="md" onClick={() => onDelete(generation.sourcePhotoId)}>
        Видалити оригінал
      </Button>
    </div>
  );
}
