// ListMyAi — історія AI-фото й генерацій клієнта для кабінту (/account,
// T-052: REF-WEB-03 «мої варіанти», AI-WEB-01). Власник — НЕ з тіла запиту:
// його визначає сесія на рівні контролера (ADR 0015 §2, ADR 0017).
//
// Одним викликом віддаємо і фото, і генерації: кабінт малює їх разом, а два
// round-trip поспіль лише розтягують час до першої фарби.

import { toVariantViews, SIGNED_URL_TTL_SEC, type AiVariantView } from './ai-read-model';
import { remainingGenerations } from './daily-limit';
import type {
  Clock,
  HaircutSuggestionRepository,
  PhotoStorage,
  SourcePhotoRepository,
} from '../domain/ports';
import type { SuggestionStatus } from '../domain/haircut-suggestion';
import type { GenerationFailureReason } from '../domain/ports';

export interface AiPhotoView {
  id: string;
  url: string;
  contentType: string;
  consentGranted: boolean;
  createdAt: string;
}

export interface AiGenerationView {
  id: string;
  sourcePhotoId: string;
  status: SuggestionStatus;
  variants: AiVariantView[];
  failureReason: GenerationFailureReason | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ListMyAiOutput {
  photos: AiPhotoView[];
  generations: AiGenerationView[];
  /** Скільки генерацій лишилося на сьогодні (ліміт 3/добу — AI-ADM-03). */
  remainingToday: number;
}

export interface ListMyAiDeps {
  photos: SourcePhotoRepository;
  suggestions: HaircutSuggestionRepository;
  storage: PhotoStorage;
  clock: Clock;
}

export class ListMyAiHandler {
  constructor(private readonly deps: ListMyAiDeps) {}

  async handle(ownerId: string): Promise<ListMyAiOutput> {
    const { photos, suggestions, storage, clock } = this.deps;
    const [photoList, suggestionList] = await Promise.all([
      photos.findByOwnerId(ownerId),
      suggestions.findByOwnerId(ownerId),
    ]);

    const photoViews = await Promise.all(
      photoList.map(async (photo) => ({
        id: photo.id,
        url: await storage.signedUrl(photo.objectKey, SIGNED_URL_TTL_SEC),
        contentType: photo.contentType,
        consentGranted: photo.consentGranted,
        createdAt: photo.createdAt.toISOString(),
      }))
    );

    const generationViews = await Promise.all(
      suggestionList.map(async (suggestion) => ({
        id: suggestion.id,
        sourcePhotoId: suggestion.sourcePhotoId,
        status: suggestion.status,
        variants: suggestion.isReady ? await toVariantViews(storage, suggestion.variants) : [],
        failureReason: suggestion.failureReason,
        errorMessage: suggestion.errorMessage,
        createdAt: suggestion.createdAt.toISOString(),
      }))
    );

    return {
      photos: photoViews,
      generations: generationViews,
      remainingToday: remainingGenerations(
        suggestionList.map((s) => ({ status: s.status, createdAt: s.createdAt })),
        clock.now()
      ),
    };
  }
}
