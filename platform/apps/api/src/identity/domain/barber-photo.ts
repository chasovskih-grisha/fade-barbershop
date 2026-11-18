// Фото барбера (T-4610a): доменна модель та валідація alt і згоди.

export interface BarberPhoto {
  userId: string;
  objectKey: string;
  alt: string;
  width: number | null;
  height: number | null;
  consentAt: Date | null;
  consentBy: string | null;
  updatedAt: Date;
}

export class InvalidBarberPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBarberPhotoError';
  }
}

export function buildBarberPhoto(props: {
  userId: string;
  objectKey: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  consentAt?: Date | null;
  consentBy?: string | null;
  updatedAt?: Date;
}): BarberPhoto {
  const alt = props.alt.trim();
  if (alt.length === 0) throw new InvalidBarberPhotoError('Alt text is required');
  if (alt.length > 120) throw new InvalidBarberPhotoError('Alt text must be ≤ 120 characters');
  const objectKey = props.objectKey.trim();
  if (objectKey.length === 0) throw new InvalidBarberPhotoError('Object key is required');
  return {
    userId: props.userId,
    objectKey,
    alt,
    width: props.width ?? null,
    height: props.height ?? null,
    consentAt: props.consentAt ?? null,
    consentBy: props.consentBy ?? null,
    updatedAt: props.updatedAt ?? new Date(),
  };
}
