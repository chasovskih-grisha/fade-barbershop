'use client';

// Редактор референсу/коментаря для «Моїх візитів» (T-043, REF-WEB-04).
// Логіка винесена з хука сторінки: useAppointmentsPage уже на межі LOC-гейту
// (ADR 0019), а стан редагування — окрема відповідальність.
import { useState } from 'react';
import { useReferenceUpload } from '../../booking/steps/useReferenceUpload';

/** Ліміт коментаря — REF-WEB-02; дублює серверну валідацію (400). */
export const COMMENT_MAX = 500;

/** Що змінюємо: undefined — не чіпати поле, '' — прибрати значення. */
export type ReferenceEdit = { referenceId?: string; comment?: string };

export function useReferenceEditor(initialComment: string) {
  const [comment, setComment] = useState(initialComment);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const upload = useReferenceUpload(setPreview, setPhotoId);

  const trim = comment.trim();
  const uploading = upload.uploadStatus === 'uploading';

  // Фото: новий photoId → замінити, removePhoto → прибрати, інакше не чіпати.
  // Коментар: порожній рядок прибирає значення (не «не чіпати»).
  const payload = (): ReferenceEdit => {
    const next: ReferenceEdit = {};
    if (removePhoto) next.referenceId = '';
    else if (photoId) next.referenceId = photoId;
    if (trim !== initialComment) next.comment = trim;
    return next;
  };

  return {
    comment,
    setComment,
    preview,
    removePhoto,
    setRemovePhoto,
    uploadStatus: upload.uploadStatus,
    uploadError: upload.uploadError,
    handleFileUpload: upload.handleFileUpload,
    clearPhoto: () => {
      setPreview(null);
      setPhotoId(null);
    },
    tooLong: trim.length > COMMENT_MAX,
    uploading,
    /** Чи є що зберігати — інакше кнопка лише шукає помилки на сервері. */
    hasChanges: removePhoto || Boolean(photoId) || trim !== initialComment,
    payload,
  };
}
