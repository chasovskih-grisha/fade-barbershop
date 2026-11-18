'use client';

import Image from 'next/image';
import { Button, AlertBanner } from '@fade/ui';
import { useAiGeneration } from './useAiGeneration';

export function AiGenerator({
  sourcePhotoId,
  onVariantSelected,
}: {
  sourcePhotoId: string | null;
  onVariantSelected: (objectKey: string) => void;
}) {
  const { state, startGeneration, handleSelect, reset } = useAiGeneration(sourcePhotoId);

  if (!sourcePhotoId) return null;

  if (state.status === 'idle') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-fg-secondary">Згенеруйте варіанти зачісок для цього фото.</p>
        <Button onClick={() => startGeneration()} disabled={!sourcePhotoId}>
          Запустити генерацію
        </Button>
      </div>
    );
  }

  if (state.status === 'generating') {
    return <AlertBanner tone="info" title="Запуск генерації..." />;
  }

  if (state.status === 'polling') {
    return <AlertBanner tone="info" title="Обробка AI..." />;
  }

  if (state.status === 'error') {
    return (
      <AlertBanner tone="error" title="Помилка">
        {state.error}
        <Button variant="ghost" size="md" onClick={reset} className="mt-2">
          Спробувати ще раз
        </Button>
      </AlertBanner>
    );
  }

  if (state.status === 'ready' && state.variants) {
    return (
      <div className="space-y-3">
        <p className="font-medium text-body">Оберіть варіант:</p>
        <div className="grid grid-cols-2 gap-3">
          {state.variants.map((v, i) => (
            <label
              key={i}
              className="relative cursor-pointer rounded-input border-2 overflow-hidden"
            >
              <input
                type="radio"
                name="aiVariant"
                value={v.objectKey}
                onChange={() => {
                  handleSelect(v.objectKey);
                  onVariantSelected(v.objectKey);
                }}
                className="sr-only"
              />
              {/* unoptimized: підписаний S3-URL (optimizer не учасник). */}
              <Image
                src={v.url}
                alt={`Варіант ${i + 1}`}
                width={384}
                height={384}
                unoptimized
                className="w-full aspect-square object-cover"
              />
            </label>
          ))}
        </div>
        <Button variant="ghost" onClick={reset}>
          Згенерувати ще раз
        </Button>
      </div>
    );
  }

  return null;
}
