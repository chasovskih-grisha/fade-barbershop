// Порти haircut-ai (Supporting, ADR 0008) — контракти, які домен і use cases
// вимагають від інфраструктури. Напрям залежностей: infra → application → domain.
// (Конвенція crm/domain/ports.ts: базові Clock/IdGenerator/Outbox/UnitOfWork
// дублюються в контексті, а не імпортуються з identity — контексти не ділять
// внутрішній домен.)

import type { SourcePhoto } from './source-photo';
import type { HaircutSuggestion, SuggestionStatus } from './haircut-suggestion';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  id(): string;
}

export interface Outbox {
  append(events: readonly { type: string; aggregateId: string; payload: unknown }[]): Promise<void>;
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

// ── Сховище фото (ADR 0008 §2: приватний бакет, master-копія в нас) ──────────

export interface StoredPhotoMeta {
  objectKey: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
}

export interface PhotoStorage {
  put(input: { bytes: Uint8Array; contentType: string; ownerId: string }): Promise<StoredPhotoMeta>;
  /** Підписаний URL для читання; TTL — короткий (приватність). */
  signedUrl(objectKey: string, ttlSeconds: number): Promise<string>;
  /** Видалення об'єктів (AI-WEB-07, AI-ADM-06). Ідемпотентно. */
  remove(objectKeys: readonly string[]): Promise<void>;
  /** Байти master-копії для ACL-провайдера. null — об'єкта немає. */
  read(objectKey: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
}

// ── AI-генерація (порт; фейк — FakeAiGenerationGateway, ADR 0019) ───────────

export interface GeneratedVariant {
  objectKey: string;
  contentType: string;
}

export type GenerationFailureReason =
  'invalid_photo' | 'provider_timeout' | 'provider_quota' | 'unknown';

export type AiGenerationPoll =
  | { state: 'processing' }
  | { state: 'ready'; variants: GeneratedVariant[] }
  | { state: 'failed'; reason: GenerationFailureReason; message?: string };

export interface AiGenerationRequest {
  suggestionId: string;
  sourcePhoto: { objectKey: string; contentType: string };
  variantCount: number;
}

export interface AiGenerationGateway {
  submit(request: AiGenerationRequest): Promise<{ jobHandle: string }>;
  poll(jobHandle: string): Promise<AiGenerationPoll>;
}

// ── Репозиторії ─────────────────────────────────────────────────────────────

export interface SourcePhotoRepository {
  findById(id: string): Promise<SourcePhoto | null>;
  /** ЖИВІ фото власника: soft-deleted (deletedAt) не повертаються — кабінет
   *  показує те, що можна ще використати. */
  findByOwnerId(ownerId: string): Promise<SourcePhoto[]>;
  /** ЖИВІ фото за списком ID (one query,_delete_ фільтром у БД).
   *  Порівняно з N×findById — один IN-запит замість окремих викликів.
   *  Порядок результатів не гарантований; споживачі ігнорують порядок.
   *  Невідомі ID не повертаються — це ок, календар їх ігнорує.
   */
  findByIds(ids: readonly string[]): Promise<SourcePhoto[]>;
  save(photo: SourcePhoto): Promise<void>;
  /** Видалення рядка разом із каскадом генерацій (об'єкти — через PhotoStorage.remove). */
  remove(id: string): Promise<void>;
}

export interface HaircutSuggestionRepository {
  findById(id: string): Promise<HaircutSuggestion | null>;
  findBySourcePhotoId(sourcePhotoId: string): Promise<HaircutSuggestion[]>;
  findByOwnerId(ownerId: string): Promise<HaircutSuggestion[]>;
  /** Черга воркера: suggestions у цих статусах (pending → submit, processing → poll). */
  findByStatuses(statuses: readonly SuggestionStatus[]): Promise<HaircutSuggestion[]>;
  save(suggestion: HaircutSuggestion): Promise<void>;
}
