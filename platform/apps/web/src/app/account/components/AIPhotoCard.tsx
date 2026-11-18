'use client';

import Image from 'next/image';
import { Button } from '@fade/ui';

interface AIPhotoCardProps {
  photo: {
    id: string;
    url: string;
    consentGranted: boolean;
    createdAt: string;
  };
  onGenerate: () => void;
  onConsent: () => void;
  onDelete: () => void;
  generating: boolean;
}

export function AIPhotoCard({
  photo,
  onGenerate,
  onConsent,
  onDelete,
  generating,
}: AIPhotoCardProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-card border border-line bg-surface-raised">
      {/* unoptimized: підписаний S3-URL (optimizer не учасник). */}
      <Image
        src={photo.url}
        alt="Source"
        width={64}
        height={64}
        unoptimized
        className="w-16 h-16 rounded-input object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-body-s text-fg-secondary">
          Завантажено {new Date(photo.createdAt).toLocaleDateString('uk-UA')}
        </p>
        <p className="text-xs text-fg-muted">
          {photo.consentGranted ? 'Згода надано ✓' : 'Згода не надано'}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {!photo.consentGranted ? (
          <Button variant="secondary" size="md" onClick={onConsent}>
            Дати згоду
          </Button>
        ) : (
          <Button variant="secondary" size="md" onClick={onConsent}>
            Відкликати згоду
          </Button>
        )}
        <Button
          variant={photo.consentGranted ? 'primary' : 'secondary'}
          size="md"
          onClick={onGenerate}
          disabled={generating || !photo.consentGranted}
        >
          {generating ? 'Генерація...' : 'Згенерувати'}
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={onDelete}
          className="text-danger hover:text-dangerHover"
        >
          Видалити
        </Button>
      </div>
    </div>
  );
}
