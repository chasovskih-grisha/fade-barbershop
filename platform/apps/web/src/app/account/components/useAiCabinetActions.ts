'use client';

export function useAiCabinetActions({
  fetchData,
  setError,
  setGeneratingId,
  setShowUpload,
}: {
  fetchData: () => Promise<void>;
  setError: (message: string | null) => void;
  setGeneratingId: (id: string | null) => void;
  setShowUpload: (open: boolean) => void;
}) {
  const handleGenerate = async (photoId: string) => {
    setGeneratingId(photoId);
    try {
      const res = await fetch('/haircut-ai/generations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePhotoId: photoId, variantCount: 4 }),
      });
      if (!res.ok) throw new Error('Generation request failed');
      fetchData();
    } catch {
      setError('Не вдалося запустити генерацію');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleUploadComplete = async (photoId: string) => {
    setShowUpload(false);
    await handleGenerate(photoId);
  };

  const handleSelectVariant = async (generationId: string, variantObjectKey: string) => {
    try {
      const res = await fetch(`/haircut-ai/generations/${generationId}/select-variant`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantObjectKey }),
      });
      if (!res.ok) throw new Error('Selection failed');
      fetchData();
    } catch {
      setError('Не вдалося обрати варіант');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/haircut-ai/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchData();
    } catch {
      setError('Не вдалося видалити фото');
    }
  };

  const handleConsent = async (photoId: string, grant: boolean) => {
    try {
      const res = await fetch(`/haircut-ai/photos/${photoId}/consent`, {
        method: grant ? 'PATCH' : 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Consent failed');
      fetchData();
    } catch {
      setError('Не вдалося оновити згоду');
    }
  };

  return {
    handleGenerate,
    handleUploadComplete,
    handleSelectVariant,
    handleDeletePhoto,
    handleConsent,
  };
}
