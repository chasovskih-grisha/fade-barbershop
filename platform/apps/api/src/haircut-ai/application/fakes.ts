// In-memory порти для функціональних тестів haircut-ai (ADR 0019: фейки, не моки).

import { SourcePhoto } from '../domain/source-photo';
import { HaircutSuggestion, type SuggestionStatus } from '../domain/haircut-suggestion';
import type {
  Clock,
  HaircutSuggestionRepository,
  IdGenerator,
  Outbox,
  SourcePhotoRepository,
  UnitOfWork,
} from '../domain/ports';

export { InMemoryStorage } from './in-memory-photo-storage';

/** Подія, записана фейковим outbox (payload — довільний). */
export type EmittedEvent = { type: string; aggregateId: string; payload: unknown };

export class InMemoryPhotos implements SourcePhotoRepository {
  readonly rows = new Map<string, SourcePhoto>();

  async findById(id: string): Promise<SourcePhoto | null> {
    return this.rows.get(id) ?? null;
  }

  async findByIds(ids: readonly string[]): Promise<SourcePhoto[]> {
    const out: SourcePhoto[] = [];
    for (const id of ids) {
      const row = this.rows.get(id);
      if (row !== undefined && !row.isDeleted) out.push(row);
    }
    return out;
  }

  async findByOwnerId(ownerId: string): Promise<SourcePhoto[]> {
    // Контракт порту: лише живі (див. prisma-source-photo.repository.ts).
    return [...this.rows.values()].filter((p) => p.ownerId === ownerId && !p.isDeleted);
  }

  async save(photo: SourcePhoto): Promise<void> {
    this.rows.set(photo.id, photo);
  }

  async remove(id: string): Promise<void> {
    this.rows.delete(id);
  }

  seed(photo: SourcePhoto): void {
    this.rows.set(photo.id, photo);
  }
}

export class InMemorySuggestions implements HaircutSuggestionRepository {
  readonly rows = new Map<string, HaircutSuggestion>();

  async findById(id: string): Promise<HaircutSuggestion | null> {
    return this.rows.get(id) ?? null;
  }

  async findBySourcePhotoId(sourcePhotoId: string): Promise<HaircutSuggestion[]> {
    return [...this.rows.values()].filter((s) => s.sourcePhotoId === sourcePhotoId);
  }

  async findByOwnerId(ownerId: string): Promise<HaircutSuggestion[]> {
    return [...this.rows.values()].filter((s) => s.ownerId === ownerId);
  }

  async findByStatuses(statuses: readonly SuggestionStatus[]): Promise<HaircutSuggestion[]> {
    const wanted = new Set<SuggestionStatus>(statuses);
    return [...this.rows.values()].filter((s) => wanted.has(s.status));
  }

  async save(suggestion: HaircutSuggestion): Promise<void> {
    this.rows.set(suggestion.id, suggestion);
  }

  seed(suggestion: HaircutSuggestion): void {
    this.rows.set(suggestion.id, suggestion);
  }
}

export class RecordingOutbox implements Outbox {
  readonly events: EmittedEvent[] = [];

  async append(events: readonly EmittedEvent[]): Promise<void> {
    this.events.push(...events);
  }

  types(): string[] {
    return this.events.map((e) => e.type);
  }
}

/** UoW без реальної транзакції: стан зберігається, але конкурентності немає. */
export const noTransaction: UnitOfWork = { run: (work) => work() };

export function fixedClock(iso = '2026-03-01T10:00:00.000Z'): Clock {
  return { now: () => new Date(iso) };
}

/** Спільний тестовий час із test-fixtures — реекспорт, щоб специфікації
 *  імпортували все з одного місця. */
export { testClock } from './test-fixtures';

export function sequentialIds(prefix = 'id'): IdGenerator {
  let n = 0;
  return { id: () => `${prefix}-${++n}` };
}
