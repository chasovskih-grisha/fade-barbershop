'use client';

import { Button, AlertBanner } from '@fade/ui';
import Image from 'next/image';

export function UploadReferencePanel({
  uploadedPhoto,
  uploadStatus,
  uploadError,
  onFileUpload,
  onClear,
}: {
  uploadedPhoto: string | null;
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
  uploadError: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-fg-secondary">Завантажте фото (jpg, png, webp ≤ 10 МБ)</p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileUpload}
        className="w-full rounded-input border border-line bg-surface-base px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      />
      {uploadedPhoto && (
        <div className="relative w-32 h-32 mx-auto">
          {/* Blob/objectURL + підписаний S3 — optimizer тут не учасник. */}
          <Image
            src={uploadedPhoto}
            alt="Референс"
            width={128}
            height={128}
            unoptimized
            className="w-full h-full object-cover rounded-input"
          />
          <Button variant="ghost" size="md" className="absolute -top-2 -right-2" onClick={onClear}>
            ✕
          </Button>
        </div>
      )}
      {uploadStatus === 'uploading' && <AlertBanner tone="info" title="Завантаження фото..." />}
      {uploadStatus === 'done' && <AlertBanner tone="success" title="Фото завантажено" />}
      {uploadError && (
        <AlertBanner tone="error" title="Помилка">
          {uploadError}
        </AlertBanner>
      )}
    </div>
  );
}
