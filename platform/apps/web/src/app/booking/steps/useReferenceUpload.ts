'use client';

import { useState, useCallback } from 'react';
import { uploadReferencePhoto } from '../referencePhotoApi';

export function useReferenceUpload(
  setUploadedPhoto: (photo: string | null) => void,
  setSelectedVariantObjectKey: (key: string | null) => void
) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError('Файл має бути зображенням (jpg, png, webp)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Розмір файлу не може перевищувати 10 МБ');
        return;
      }
      setUploadError(null);
      setUploadStatus('uploading');
      const reader = new FileReader();
      reader.onload = (event) => setUploadedPhoto(event.target?.result as string);
      reader.readAsDataURL(file);
      uploadReferencePhoto(file)
        .then((photoId) => {
          setSelectedVariantObjectKey(photoId);
          setUploadStatus('done');
        })
        .catch((err: Error) => {
          setUploadedPhoto(null);
          setSelectedVariantObjectKey(null);
          setUploadStatus('error');
          setUploadError(err.message);
        });
    },
    [setUploadedPhoto, setSelectedVariantObjectKey]
  );

  return { uploadStatus, setUploadStatus, uploadError, handleFileUpload };
}
