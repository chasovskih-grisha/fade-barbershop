// Read-модель AI-варіантів: клієнт ніколи не отримує «сирі» objectKeys як
// посилання — лише підписані URL короткого TTL (ADR 0008 §2, приватність бакета).

import type { GeneratedVariant, PhotoStorage } from '../domain/ports';

/** TTL підписаного URL — 15 хв (верхня межа підписувача S3PhotoStorage). */
export const SIGNED_URL_TTL_SEC = 900;

export interface AiVariantView {
  objectKey: string;
  contentType: string;
  url: string;
}

export function toVariantViews(
  storage: PhotoStorage,
  variants: readonly GeneratedVariant[]
): Promise<AiVariantView[]> {
  return Promise.all(
    variants.map(async (variant) => ({
      objectKey: variant.objectKey,
      contentType: variant.contentType,
      url: await storage.signedUrl(variant.objectKey, SIGNED_URL_TTL_SEC),
    }))
  );
}
