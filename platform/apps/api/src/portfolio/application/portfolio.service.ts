/**
 * T-4455: use case-и портфоліо барбера.
 *
 * Правила — у domain/portfolio-item.ts. Тут порти (сховище, журнал згоди,
 * годинник) і рольові перевірки: додавати може лише барбер, публікувати
 * й ховати — лише адмін, відкликати згоду — клієнт/барбер/адмін.
 *
 * Сховище і журнал in-memory: у `prisma/schema.prisma` ще немає таблиць
 * портфоліо. Порти готові до Prisma-адаптера без зміни застосункового шару.
 */
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import {
  PortfolioConflictError,
  PortfolioError,
  PortfolioForbiddenError,
  addPortfolioItem,
  hidePortfolioItem,
  publishPortfolioItem,
  recordClientConsent,
  revokeClientConsent,
  type ClientConsent,
  type PortfolioActorRole,
  type PortfolioCategory,
  type PortfolioItem,
  type PublicationStatus,
} from '../domain/portfolio-item';

export const PORTFOLIO_REPOSITORY = 'PORTFOLIO_REPOSITORY';
export const PORTFOLIO_CONSENT_JOURNAL = 'PORTFOLIO_CONSENT_JOURNAL';
export const PORTFOLIO_CLOCK = 'PORTFOLIO_CLOCK';

export interface PortfolioClock {
  now(): Date;
}

export interface PortfolioRepository {
  findById(id: string): Promise<PortfolioItem | null>;
  save(item: PortfolioItem): Promise<void>;
  list(): Promise<PortfolioItem[]>;
}

export class InMemoryPortfolioRepository implements PortfolioRepository {
  private readonly items = new Map<string, PortfolioItem>();

  constructor(seed: PortfolioItem[] = []) {
    for (const item of seed) this.items.set(item.id, item);
  }

  async findById(id: string): Promise<PortfolioItem | null> {
    return this.items.get(id) ?? null;
  }

  async save(item: PortfolioItem): Promise<void> {
    this.items.set(item.id, item);
  }

  async list(): Promise<PortfolioItem[]> {
    return [...this.items.values()];
  }
}

/** Журнал згоди: хто, коли, яким способом і з яким рішенням. */
export interface ConsentJournalEntry {
  itemId: string;
  barberId: string;
  opinion: ClientConsent['opinion'];
  obtainedVia: ClientConsent['obtainedVia'] | null;
  by: string;
  at: Date;
  action: 'recorded' | 'revoked';
}

export interface PortfolioConsentJournal {
  append(entry: ConsentJournalEntry): void;
  list(itemId?: string): ConsentJournalEntry[];
}

export class InMemoryPortfolioConsentJournal implements PortfolioConsentJournal {
  private readonly entries: ConsentJournalEntry[] = [];

  append(entry: ConsentJournalEntry): void {
    this.entries.push(entry);
  }

  list(itemId?: string): ConsentJournalEntry[] {
    return this.entries.filter((entry) => !itemId || entry.itemId === itemId);
  }
}

export interface PortfolioPhotoInput {
  objectKey: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
}

export interface PortfolioView {
  id: string;
  barberId: string;
  category: PortfolioCategory;
  caption: string | null;
  tags: string[];
  before: PortfolioItem['before'];
  after: PortfolioItem['after'];
  status: PublicationStatus;
  hasConsent: boolean;
  consentOpinion: ClientConsent['opinion'] | null;
  createdAt: Date;
  publishedAt: Date | null;
  hiddenReason: string | null;
}

export function toPortfolioView(item: PortfolioItem): PortfolioView {
  return {
    id: item.id,
    barberId: item.barberId,
    category: item.category,
    caption: item.caption,
    tags: [...item.tags],
    before: item.before,
    after: [...item.after],
    status: item.status,
    hasConsent: Boolean(item.consent && item.consent.opinion !== 'none' && !item.consent.revokedAt),
    consentOpinion: item.consent?.opinion ?? null,
    createdAt: item.createdAt,
    publishedAt: item.publishedAt,
    hiddenReason: item.hiddenReason,
  };
}

@Injectable()
export class PortfolioService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY)
    private readonly repository: PortfolioRepository,
    @Inject(PORTFOLIO_CONSENT_JOURNAL)
    private readonly journal: PortfolioConsentJournal,
    @Inject(PORTFOLIO_CLOCK)
    private readonly clock: PortfolioClock
  ) {}

  /** Барбер додає фото зі свого пристрою; id генерує сервер. */
  async addByBarber(input: {
    actorId: string;
    actorRole: PortfolioActorRole;
    barberId?: string;
    category: string;
    caption?: string | null;
    tags?: readonly string[];
    before?: PortfolioPhotoInput | null;
    after: PortfolioPhotoInput[];
    consent?: { opinion: ClientConsent['opinion']; obtainedVia: ClientConsent['obtainedVia'] };
    at?: Date;
  }): Promise<PortfolioView> {
    if (input.actorRole !== 'barber' && input.actorRole !== 'admin') {
      throw new PortfolioForbiddenError('Only a barber or admin can add portfolio items');
    }
    const barberId = (input.barberId ?? input.actorId).trim();
    if (input.actorRole === 'barber' && barberId !== input.actorId) {
      throw new PortfolioForbiddenError('A barber can only add items to their own portfolio');
    }

    const at = input.at ?? this.clock.now();
    const consent: ClientConsent | null = input.consent
      ? {
          opinion: input.consent.opinion,
          obtainedVia: input.consent.obtainedVia,
          by: input.actorId,
          at,
        }
      : null;

    const item = addPortfolioItem({
      id: uuidv7(),
      barberId,
      category: input.category,
      ...(input.caption === undefined ? {} : { caption: input.caption }),
      ...(input.tags ? { tags: input.tags } : {}),
      ...(input.before ? { before: input.before } : {}),
      after: input.after,
      consent,
      at,
    });

    await this.repository.save(item);
    if (consent) this.recordConsentJournal(item, consent, at, 'recorded');

    return toPortfolioView(item);
  }

  /** Фіксує згоду клієнта (opt-in екран або відмітка в кріслі). */
  async recordConsent(
    id: string,
    input: {
      actorId: string;
      actorRole: PortfolioActorRole;
      opinion: ClientConsent['opinion'];
      obtainedVia: ClientConsent['obtainedVia'];
      at?: Date;
    }
  ): Promise<PortfolioView> {
    if (input.actorRole !== 'barber' && input.actorRole !== 'admin') {
      throw new PortfolioForbiddenError('Only a barber or admin can record client consent');
    }
    const item = await this.require(id);
    if (input.actorRole === 'barber' && item.barberId !== input.actorId) {
      throw new PortfolioForbiddenError('A barber can only record consent on their own items');
    }

    const at = input.at ?? this.clock.now();
    const consent: ClientConsent = {
      opinion: input.opinion,
      obtainedVia: input.obtainedVia,
      by: input.actorId,
      at,
    };
    const updated = recordClientConsent(item, consent);

    await this.repository.save(updated);
    this.recordConsentJournal(updated, consent, at, 'recorded');
    return toPortfolioView(updated);
  }

  async publish(
    id: string,
    input: { by: string; role: PortfolioActorRole; at?: Date }
  ): Promise<PortfolioView> {
    const item = await this.require(id);
    const updated = publishPortfolioItem(item, {
      by: input.by,
      role: input.role,
      at: input.at ?? this.clock.now(),
    });
    await this.repository.save(updated);
    return toPortfolioView(updated);
  }

  async hide(
    id: string,
    input: { by: string; role: PortfolioActorRole; reason: string; at?: Date }
  ): Promise<PortfolioView> {
    const item = await this.require(id);
    const updated = hidePortfolioItem(item, {
      by: input.by,
      role: input.role,
      reason: input.reason,
      at: input.at ?? this.clock.now(),
    });
    await this.repository.save(updated);
    return toPortfolioView(updated);
  }

  /** Відкликання згоди: елементи клієнта зникають з дошки негайно. */
  async revokeConsent(
    id: string,
    input: { by: string; at?: Date }
  ): Promise<PortfolioView> {
    const item = await this.require(id);
    const at = input.at ?? this.clock.now();
    const updated = revokeClientConsent(item, { by: input.by, at });

    await this.repository.save(updated);
    this.journal.append({
      itemId: updated.id,
      barberId: updated.barberId,
      opinion: 'none',
      obtainedVia: null,
      by: input.by,
      at,
      action: 'revoked',
    });
    return toPortfolioView(updated);
  }

  /** Барберський екран: усі власні елементи зі статусами. */
  async listForBarber(barberId: string): Promise<PortfolioView[]> {
    const items = await this.repository.list();
    return items
      .filter((item) => item.barberId === barberId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toPortfolioView);
  }

  /** Черга модерації / публічна дошка. */
  async listForAdmin(status?: PublicationStatus): Promise<PortfolioView[]> {
    const items = await this.repository.list();
    return items
      .filter((item) => !status || item.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toPortfolioView);
  }

  /**
   * Публічна галерея: лише опубліковане й лише за наявної згоди.
   * Повторна перевірка згоди — захист від даних, змінених в обхід use case.
   */
  async publicGallery(barberId: string): Promise<PortfolioView[]> {
    const items = await this.repository.list();
    return items
      .filter(
        (item) =>
          item.barberId === barberId &&
          item.status === 'published' &&
          item.consent !== null &&
          item.consent.opinion !== 'none' &&
          !item.consent.revokedAt
      )
      .map(toPortfolioView);
  }

  consentJournal(itemId?: string): ConsentJournalEntry[] {
    return this.journal.list(itemId);
  }

  private recordConsentJournal(
    item: PortfolioItem,
    consent: ClientConsent,
    at: Date,
    action: ConsentJournalEntry['action']
  ): void {
    this.journal.append({
      itemId: item.id,
      barberId: item.barberId,
      opinion: consent.opinion,
      obtainedVia: consent.obtainedVia,
      by: consent.by,
      at,
      action,
    });
  }

  private async require(id: string): Promise<PortfolioItem> {
    const item = await this.repository.findById(id);
    if (!item) throw new PortfolioError(`Portfolio item ${id} not found`);
    return item;
  }
}

export { PortfolioConflictError, PortfolioForbiddenError };
