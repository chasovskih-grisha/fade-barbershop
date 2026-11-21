'use client';

import { useState } from 'react';
import { Button, Modal } from '@fade/ui';

interface UploadPhotoModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (photoId: string) => void;
}

export function UploadPhotoModal({ open, onClose, onComplete }: UploadPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/booking/reference-photos', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { photoId } = await res.json();
      onComplete(photoId);
    } catch {
      setError('Не вдалося завантажити фото');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Завантажити фото"
      description="jpg, png, webp — до 10 МБ"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !file}>
            {uploading ? 'Завантаження...' : 'Завантажити'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {error && (
          <div className="text-danger text-body-s" role="alert">
            {error}
          </div>
        )}
        <input
          type="file"
          aria-label="Виберіть фото для завантаження"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > 10 * 1024 * 1024) {
                setError('Файл занадто великий (макс 10 МБ)');
                setFile(null);
              } else {
                setFile(f);
                setError(null);
              }
            }
          }}
          className="w-full rounded-input border border-line bg-surface-base p-2"
        />
      </div>
    </Modal>
  );
}
