// API для AI-генерації у флоу запису (T-050/051): згода, генерація, поллінг, вибір.

export async function giveConsent(sourcePhotoId: string): Promise<void> {
  const res = await fetch(`/haircut-ai/photos/${sourcePhotoId}/consent`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Не вдалося надати згоду');
}

export async function revokeConsent(sourcePhotoId: string): Promise<void> {
  const res = await fetch(`/haircut-ai/photos/${sourcePhotoId}/consent`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Не вдалося відкликати згоду');
}

export interface RequestGenerationResult {
  suggestionId: string;
  status: 'pending';
}

export async function requestGeneration(
  sourcePhotoId: string,
  variantCount = 4
): Promise<RequestGenerationResult> {
  const res = await fetch('/haircut-ai/generations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePhotoId, variantCount }),
  });
  if (!res.ok) throw new Error('Не вдалося запустити генерацію');
  return res.json();
}

export interface GenerationStatus {
  suggestionId: string;
  sourcePhotoId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  variantCount: number;
  variants: { url: string; objectKey: string; contentType: string }[];
  failureReason?: string;
  errorMessage?: string;
  createdAt: string;
}

export async function pollGeneration(suggestionId: string): Promise<GenerationStatus> {
  const res = await fetch(`/haircut-ai/generations/${suggestionId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Не вдалося отримати статус');
  return res.json();
}

export async function selectVariant(suggestionId: string, variantObjectKey: string): Promise<void> {
  const res = await fetch(`/haircut-ai/generations/${suggestionId}/select-variant`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantObjectKey }),
  });
  if (!res.ok) throw new Error('Не вдалося обрати варіант');
}
