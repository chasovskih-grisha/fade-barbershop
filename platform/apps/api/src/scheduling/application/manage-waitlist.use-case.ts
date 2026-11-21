/* eslint-disable max-lines -- cohesive module (112 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4559: керована черга очікування — застосунковий шар.
// Правила життєвого циклу — у domain/waitlist-admin.ts (і waitlist-queue.ts для
// пріоритету/soft-hold); тут порт сховища, збереження й послідовність кроків.
// Сховище in-memory: у `prisma/schema.prisma` немає таблиці waitlist-заявок
// (її додає persistence-слайс T-170/T-4559). Порт `WaitlistExtendedRepository`
// готовий прийняти Prisma-адаптер без зміни use-case.

import { Inject, Injectable } from '@nestjs/common';
import {
  applyAdminAction,
  adminQueueRows,
  cancelByClient,
  expireOffersWithReleases,
  planOfferCascade,
  selectBestSlot,
  type CascadeOffer,
  type FreedSlot,
  type WaitlistAdminAction,
  type WaitlistAdminInput,
  type WaitlistEntryData,
  type WaitlistQueueRow,
} from '../domain/waitlist-admin';
import { priorityScore, type WaitlistEntryHistoryEntry } from '../domain/waitlist-queue';

export const WAITLIST_EXTENDED_REPOSITORY = 'WAITLIST_EXTENDED_REPOSITORY';

export interface WaitlistExtendedRepository {
  findById(id: string): Promise<WaitlistEntryData | null>;
  list(): Promise<WaitlistEntryData[]>;
  save(entry: WaitlistEntryData): Promise<void>;
}

export class InMemoryWaitlistExtendedRepository implements WaitlistExtendedRepository {
  private readonly entries = new Map<string, WaitlistEntryData>();

  async findById(id: string): Promise<WaitlistEntryData | null> {
    return this.entries.get(id) ?? null;
  }

  async list(): Promise<WaitlistEntryData[]> {
    return [...this.entries.values()];
  }

  async save(entry: WaitlistEntryData): Promise<void> {
    this.entries.set(entry.id, entry);
  }
}

@Injectable()
export class ManageWaitlistService {
  constructor(
    @Inject(WAITLIST_EXTENDED_REPOSITORY)
    private readonly repository: WaitlistExtendedRepository
  ) {}

  /** Заявка потрапляє в керовану чергу (реєстрація або бекфіл). */
  async register(entry: WaitlistEntryData): Promise<WaitlistEntryData> {
    await this.repository.save(entry);
    return entry;
  }

  /** Черга адміна: пріоритет (з VIP/ручним зміщенням) → час очікування. */
  async queue(locationId?: string): Promise<{ total: number; rows: WaitlistQueueRow[] }> {
    const entries = (await this.repository.list()).filter(
      (entry) => !locationId || entry.configuration.locationId === locationId
    );
    const rows = adminQueueRows(entries, priorityScore);
    return { total: rows.length, rows };
  }

  /** Ручні дії: підняти/опустити/пауза/відновлення/переведення. */
  async adminAction(
    id: string,
    action: WaitlistAdminAction,
    input: WaitlistAdminInput
  ): Promise<{ entry: WaitlistEntryData; log: string }> {
    const entry = await this.require(id);
    const result = applyAdminAction(entry, action, input);
    await this.repository.save(result.entry);
    return result;
  }

  /** Відмова клієнта: hold звільняється, заявка закривається. */
  async cancel(
    id: string,
    input: { by: string; reason?: string; at?: Date }
  ): Promise<{ entry: WaitlistEntryData; releasedHold: boolean }> {
    const entry = await this.require(id);
    const result = cancelByClient(entry, input);
    await this.repository.save(result.entry);
    return result;
  }

  /** Каскад: топ-N кандидатів отримують пропозиції одночасно. */
  async planOffers(
    slot: FreedSlot,
    options: { now?: Date; count?: number; windowMinutes?: number } = {}
  ): Promise<{ offers: CascadeOffer[] }> {
    const now = options.now ?? new Date();
    const entries = await this.repository.list();
    const offers = planOfferCascade(entries, slot, {
      now,
      ...(options.count === undefined ? {} : { count: options.count }),
      ...(options.windowMinutes === undefined ? {} : { windowMinutes: options.windowMinutes }),
    });

    for (const offer of offers) await this.repository.save(offer.entry);
    return { offers };
  }

  /** Таймер пропозицій: прострочені закриваються, звільнений слот одразу
   * пропонується наступним (OfferExpired → next in queue).
   */
  async expireAndReoffer(
    slot: FreedSlot,
    now: Date = new Date()
  ): Promise<{ expiredIds: string[]; offers: CascadeOffer[] }> {
    const entries = await this.repository.list();
    const { entries: updated, expiredIds } = expireOffersWithReleases(entries, now);
    const expired = new Set(expiredIds);

    // Прострочені заявки зберігаємо як закриті, але у новий каскад не беремо.
    for (const entry of updated) {
      if (expired.has(entry.id)) await this.repository.save(entry);
    }
    const activeEntries = updated.filter((entry) => !expired.has(entry.id));

    if (activeEntries.length === 0) return { expiredIds, offers: [] };

    const offers = planOfferCascade(activeEntries, slot, { now });
    for (const offer of offers) await this.repository.save(offer.entry);
    return { expiredIds, offers };
  }

  /** Підгонка вікна: найраніший слот у межах вікна клієнта. */
  async bestSlot(id: string, slots: FreedSlot[]): Promise<FreedSlot | null> {
    return selectBestSlot((await this.require(id)).configuration, slots);
  }

  /** Журнал заявки для аудиту. */
  async history(id: string): Promise<WaitlistEntryHistoryEntry[]> {
    return (await this.require(id)).history ?? [];
  }

  private async require(id: string): Promise<WaitlistEntryData> {
    const entry = await this.repository.findById(id);
    if (!entry) throw new Error(`Waitlist entry ${id} not found`);
    return entry;
  }
}
