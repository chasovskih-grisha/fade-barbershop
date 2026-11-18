import { useState } from 'react';
import { uploadReferencePhoto, type PickedPhoto } from '../../../../lib/api/reference-photo';
import { pickReferencePhoto } from '../../../../lib/reference-picker';

/** Ліміт коментаря — REF-WEB-02; дублює серверну валідацію (400). */
export const COMMENT_MAX = 500;

/** Що змінюємо: undefined — не чіпати поле, '' — прибрати значення. */
export type ReferenceEdit = { referenceId?: string; comment?: string };

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

function reason(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Стан редагування референсу/коментаря (REF-MOB-02, правило REF-WEB-04).
 * Той самий payload, що й на web: undefined — не чіпати, '' — прибрати;
 * коментар порівнюється з початковим значенням, тож пробіли не «змінюють».
 */
/** Тип стану редактора — щоб поля форми не дублювали його вручну. */
export type ReferenceEditor = ReturnType<typeof useReferenceEditor>;

export function useReferenceEditor(initialComment: string) {
  const [comment, setComment] = useState(initialComment);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const trim = comment.trim();
  const uploading = uploadStatus === 'uploading';

  /** Галерея → прев'ю → вивантаження. Скасований вибір не чіпає стан. */
  const choosePhoto = async () => {
    setUploadError(null);
    let picked: PickedPhoto | null = null;
    try {
      picked = await pickReferencePhoto();
      if (!picked) return;
      setPhoto(picked);
      setRemovePhoto(false);
      setUploadStatus('uploading');
      setPhotoId(await uploadReferencePhoto(picked));
      setUploadStatus('done');
    } catch (error) {
      setPhoto(null);
      setPhotoId(null);
      setUploadStatus('error');
      setUploadError(reason(error, 'Не вдалося завантажити фото'));
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoId(null);
    setUploadStatus('idle');
    setUploadError(null);
  };

  // Фото: новий photoId → замінити, removePhoto → прибрати, інакше не чіпати.
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
    photo,
    removePhoto,
    setRemovePhoto,
    uploadStatus,
    uploadError,
    choosePhoto,
    clearPhoto,
    tooLong: trim.length > COMMENT_MAX,
    uploading,
    length: trim.length,
    /** Чи є що зберігати — інакше запит лише шукає помилку на сервері. */
    hasChanges: removePhoto || Boolean(photoId) || trim !== initialComment,
    payload,
  };
}
