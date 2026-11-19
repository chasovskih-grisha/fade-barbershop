// Пропозиція слота з черги (T-4453): вибір за пріоритетом, soft-hold з
// тайм-аутом, каскад на наступного при пропуску і ручне втручання оператора.
// Рішення — у домені (waitlist-queue.ts), тут лише послідовність кроків і
// сповіщення; канал SMS уже існує (notifications/send-sms.use-case).
import {
  applyOperatorOverride,
  acceptOffer,
  expireOffers,
  offerSlot,
  rankEntries,
  selectNextEntry,
  type FreedSlot,
  type OperatorOverride,
  type WaitlistEntryData,
} from '../domain/waitlist-queue';
import {
  WaitlistOfferAccepted,
  WaitlistOfferExpired,
  WaitlistOfferSent,
  WaitlistOverrideApplied,
} from '../domain/waitlist.events';
import type { WaitlistEntryPaused } from '../domain/waitlist.events';

export type WaitlistDomainEvent =
  | WaitlistOfferSent
  | WaitlistOfferAccepted
  | WaitlistOfferExpired
  | WaitlistOverrideApplied
  | WaitlistEntryPaused;

/** Сповіщення про пропозицію/прострочення (реалізація — SMS-адаптер). */
export interface WaitlistOfferNotifier {
  sendOffer(input: {
    entryId: string;
    clientId: string;
    slot: FreedSlot;
    expiresAt: Date;
  }): Promise<void>;
  sendExpired(input: { entryId: string; clientId: string }): Promise<void>;
}

export interface OfferNextResult {
  /** Кому запропоновано слот; `null` — черга порожня або є активна пропозиція. */
  offered: WaitlistEntryData | null;
  /** Пропозиції, що прострочилися на цьому кроці. */
  expiredEntryIds: string[];
  /** Причини для журналу: кожен крок лишає слід. */
  log: string[];
  /** Події для outbox (T-170a): offer_sent / offer_expired. */
  events: WaitlistDomainEvent[];
}

export class OfferNextWaitlistCandidate {
  constructor(
    private readonly notifier: WaitlistOfferNotifier,
    private readonly clock: () => Date = () => new Date()
  ) {}

  /**
   * Крок каскаду: спершу закриваємо прострочені пропозиції (і повідомляємо
   * клієнтів), далі — якщо нікому ще не запропоновано — обираємо найвищий
   * пріоритет і ставимо soft-hold. Активна пропозиція блокує нову.
   */
  async execute(input: {
    entries: WaitlistEntryData[];
    slot: FreedSlot;
    now?: Date;
  }): Promise<OfferNextResult> {
    const now = input.now ?? this.clock();
    const log: string[] = [];
    const events: WaitlistDomainEvent[] = [];

    const expiredEntryIds = input.entries
      .filter(
        (entry) =>
          entry.status === 'offered' &&
          entry.holdExpiresAt !== undefined &&
          entry.holdExpiresAt.getTime() <= now.getTime()
      )
      .map((entry) => entry.id);

    const current = expireOffers(input.entries, now);
    for (const entryId of expiredEntryIds) {
      const entry = input.entries.find((candidate) => candidate.id === entryId);
      if (!entry) continue;
      log.push(`waitlist.offer.expired entry=${entry.id} client=${entry.clientId}`);
      events.push(new WaitlistOfferExpired({ entry, occurredAt: now }));
      await this.notifier.sendExpired({ entryId: entry.id, clientId: entry.clientId });
    }

    const activeOffer = current.find(
      (entry) => entry.status === 'offered' && entry.holdExpiresAt !== undefined
    );
    if (activeOffer) {
      log.push(`waitlist.offer.held entry=${activeOffer.id}`);
      return { offered: null, expiredEntryIds, log, events };
    }

    const next = selectNextEntry(current, input.slot);
    if (!next) {
      log.push('waitlist.offer.empty');
      return { offered: null, expiredEntryIds, log, events };
    }

    const offered = offerSlot(next, now);
    log.push(
      `waitlist.offer.sent entry=${offered.id} client=${offered.clientId} expires=${offered.holdExpiresAt?.toISOString() ?? ''}`
    );
    events.push(new WaitlistOfferSent({ entry: offered, occurredAt: now }));
    await this.notifier.sendOffer({
      entryId: offered.id,
      clientId: offered.clientId,
      slot: input.slot,
      expiresAt: offered.holdExpiresAt ?? now,
    });

    return { offered, expiredEntryIds, log, events };
  }

  /** Акцепт у межах hold; далі запис створює booking-флоу. */
  accept(input: {
    entry: WaitlistEntryData;
    now?: Date;
  }): { entry: WaitlistEntryData; event: WaitlistOfferAccepted } {
    const now = input.now ?? this.clock();
    const entry = acceptOffer(input.entry, now);
    return { entry, event: new WaitlistOfferAccepted({ entry, occurredAt: now }) };
  }

  /**
   * Ручне втручання оператора (T-4453): підняти заявку з причиною.
   * Повертає оновлений список і рядок журналу для аудиту.
   */
  override(input: {
    entries: WaitlistEntryData[];
    entryId: string;
    override: OperatorOverride;
  }): { entries: WaitlistEntryData[]; log: string; event: WaitlistOverrideApplied } {
    const target = input.entries.find((entry) => entry.id === input.entryId);
    if (!target) throw new Error(`Waitlist entry ${input.entryId} not found`);

    const { entry, log } = applyOperatorOverride(target, input.override);
    return {
      entries: input.entries.map((candidate) => (candidate.id === entry.id ? entry : candidate)),
      log,
      event: new WaitlistOverrideApplied({ entry, occurredAt: input.override.at }),
    };
  }

  /** Порядок кандидатів для адмінки: хто наступний і чому. */
  ranking(entries: WaitlistEntryData[], slot: FreedSlot): WaitlistEntryData[] {
    return rankEntries(entries, slot);
  }
}
