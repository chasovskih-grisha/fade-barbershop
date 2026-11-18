'use client';

import { Button, EmptyState } from '@fade/ui';
import { AIPhotoCard } from './AIPhotoCard';
import { AIGenerationCard } from './AIGenerationCard';

type CabinetData = {
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
};

export function AICabinetBody({
  data,
  generatingId,
  onUpload,
  onGenerate,
  onConsent,
  onDelete,
  onSelectVariant,
}: {
  data: CabinetData | null;
  generatingId: string | null;
  onUpload: () => void;
  onGenerate: (photoId: string) => void;
  onConsent: (photoId: string, grant: boolean) => void;
  onDelete: (photoId: string) => void;
  onSelectVariant: (generationId: string, variantObjectKey: string) => void;
}) {
  const photos = data?.photos ?? [];
  const generations = data?.generations ?? [];

  return (
    <div className="rounded-card border border-line bg-surface-raised p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-h4">AI-підбір зачіски</h2>
        <Button onClick={onUpload} disabled={!!generatingId}>
          Завантажити фото
        </Button>
      </div>

      <p className="text-body-s text-fg-secondary mb-4">
        Завантажте фото (jpg, png, webp ≤ 10 МБ), погодьтеся з обробкою, і нейромережа запропонує
        3–4 варіанти. Ліміт: {data?.remainingToday ?? 3} генерацій сьогодні.
      </p>

      {photos.length === 0 && (
        <EmptyState title="Фото немає" description="Завантажте перше фото для AI-підбору" />
      )}

      {photos.length > 0 && (
        <div className="space-y-4">
          {photos.map((photo) => (
            <AIPhotoCard
              key={photo.id}
              photo={photo}
              onGenerate={() => onGenerate(photo.id)}
              onConsent={() => onConsent(photo.id, !photo.consentGranted)}
              onDelete={() => onDelete(photo.id)}
              generating={generatingId === photo.id}
            />
          ))}
        </div>
      )}

      {generations.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-h6 mb-4">Ваші генерації</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generations.map((gen) => (
              <AIGenerationCard
                key={gen.id}
                generation={gen}
                onSelect={onSelectVariant}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
