'use client';

import Image from 'next/image';
import { Button } from '@fade/ui';
import {
  type GenerationView,
  useGenerationPoll,
  GenerationHeader,
  FailedGeneration,
  statusLabels,
} from './AIGenerationParts';

export function AIGenerationCard({
  generation,
  onSelect,
  onDelete,
}: {
  generation: GenerationView;
  onSelect: (generationId: string, variantObjectKey: string) => void;
  onDelete: (photoId: string) => void;
}) {
  useGenerationPoll(generation);

  if (generation.status === 'failed') {
    return <FailedGeneration generation={generation} onDelete={onDelete} />;
  }

  if (generation.status === 'pending' || generation.status === 'processing') {
    return (
      <div className="rounded-card border border-line bg-surface-raised p-4">
        <GenerationHeader status={generation.status} createdAt={generation.createdAt} />
        <div className="h-32 flex items-center justify-center bg-surface-base rounded-input">
          <div className="flex flex-col items-center gap-2 text-fg-secondary">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent-blue border-t-transparent" />
            <span className="text-body-s">{statusLabels[generation.status]}...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface-raised p-4 flex flex-col">
      <GenerationHeader status="ready" createdAt={generation.createdAt} />
      <div className="flex-1 grid gap-2 sm:grid-cols-2">
        {generation.variants.map((v, i) => (
          <div
            key={v.objectKey}
            className="relative aspect-square rounded-input overflow-hidden bg-surface-base"
          >
            {/* unoptimized: підписаний S3-URL (optimizer не учасник). */}
            <Image
              src={v.url}
              alt={`Варіант ${i + 1}`}
              width={256}
              height={256}
              unoptimized
              className="w-full h-full object-cover"
            />
            <Button
              className="absolute bottom-2 right-2"
              size="md"
              onClick={() => onSelect(generation.id, v.objectKey)}
            >
              Обрати
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
