/* eslint-disable max-lines, complexity -- cohesive module (160 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 12 vs 10); refactor tracked in T-2500f */
// T-190: застосування домену галереї — додавання барбером, згода клієнта,
// черга модерації адміна й публічна проєкція.
//
// Порт сховища `PortfolioRepository` навмисно in-memory: у
// `prisma/schema.prisma` ще немає моделей галереї, тож durable-адаптер
// з'явиться разом із persistence-слайсом (див. README контексту). Домен і
// контракт сервісу від цього не залежать.
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import {
  PortfolioError,
  PortfolioItem,
  type ConsentJournalEntry,
  type PortfolioActorRole,
  type PortfolioItemState,
  type PortfolioPhotoInput,
  type PortfolioView,
  type PublicationStatus,
} from '../domain/portfolio-item';

export type {
  ClientConsent,
  ConsentJournalEntry,
  PortfolioActorRole,
  PortfolioPhoto,
  PortfolioPhotoInput,
  PortfolioView,
  PublicationStatus,
} from '../domain/portfolio-item';

export const PORTFOLIO_REPOSITORY = 'PORTFOLIO_REPOSITORY';

export interface PortfolioRepository {
  findById(id: string): Promise<PortfolioItem | null>;
  save(item: PortfolioItem): Promise<void>;
  list(): Promise<PortfolioItem[]>;
}

/** Сховище в пам'яті: один екземпляр на процес, поки немає таблиці галереї. */
export class InMemoryPortfolioRepository implements PortfolioRepository {
  private readonly items = new Map<string, PortfolioItemState>();

  async findById(id: string): Promise<PortfolioItem | null> {
    const state = this.items.get(id);
    return state ? PortfolioItem.restore(state) : null;
  }

  async save(item: PortfolioItem): Promise<void> {
    this.items.set(item.id, item.toState());
  }

  async list(): Promise<PortfolioItem[]> {
    return [...this.items.values()].map((state) => PortfolioItem.restore(state));
  }
}

export interface AddPortfolioItemInput {
  actorId: string;
  actorRole: PortfolioActorRole;
  barberId?: string;
  category: string;
  caption?: string | null;
  tags?: string[];
  before?: PortfolioPhotoInput | null;
  after: PortfolioPhotoInput[];
  consent?: {
    opinion: 'yes' | 'anonymous' | 'no';
    obtainedVia: 'optin_screen' | 'barber_chair' | 'admin';
  };
  at?: Date;
}

export interface RecordConsentInput {
  actorId: string;
  actorRole: PortfolioActorRole;
  opinion: 'yes' | 'anonymous' | 'no';
  obtainedVia: 'optin_screen' | 'barber_chair' | 'admin';
  at?: Date;
}

export interface ModerationInput {
  by: string;
  role: PortfolioActorRole;
  reason: string;
  at?: Date;
}

export interface PublishInput {
  by: string;
  role: PortfolioActorRole;
  at?: Date;
}

@Injectable()
export class PortfolioService {
  constructor(@Inject(PORTFOLIO_REPOSITORY) private readonly repository: PortfolioRepository) {}

  /** PRT-BAR-01 / PRT-004: барбер додає пару зі свого пристрою, адмін — з картки візиту. */
  async addByBarber(input: AddPortfolioItemInput): Promise<PortfolioView> {
    if (input.actorRole !== 'barber' && input.actorRole !== 'admin') {
      throw new PortfolioError('Only a barber or an admin can add portfolio items');
    }

    const barberId = input.barberId ?? (input.actorRole === 'barber' ? input.actorId : undefined);
    if (!barberId) throw new PortfolioError('Barber id is required');

    const at = input.at ?? new Date();
    const item = PortfolioItem.create({
      id: uuidv7(),
      barberId,
      category: input.category,
      ...(input.caption === undefined ? {} : { caption: input.caption }),
      ...(input.tags ? { tags: input.tags } : {}),
      ...(input.before === undefined ? {} : { before: input.before }),
      after: input.after ?? [],
      ...(input.consent ? { consent: { ...input.consent, by: input.actorId, at } } : {}),
      at,
    });

    await this.repository.save(item);
    return item.toView();
  }

  /** PRT-BAR-03: свої елементи зі статусами модерації. */
  async listForBarber(barberId: string): Promise<PortfolioView[]> {
    const items = await this.repository.list();
    return items
      .filter((item) => item.barberId === barberId)
      .sort((a, b) => b.toView().createdAt.getTime() - a.toView().createdAt.getTime())
      .map((item) => item.toView());
  }

  /** PRT-006: згода клієнта — opt-in екран, крісло або адмін. */
  async recordConsent(id: string, input: RecordConsentInput): Promise<PortfolioView> {
    const item = await this.requireItem(id);
    const updated = item.recordConsent({
      opinion: input.opinion,
      obtainedVia: input.obtainedVia,
      by: input.actorId,
      ...(input.at ? { at: input.at } : {}),
    });
    await this.repository.save(updated);
    return updated.toView();
  }

  /** PRT-006: відкликання згоди ховає елемент миттєво. */
  async revokeConsent(id: string, input: { by: string; at?: Date }): Promise<PortfolioView> {
    const item = await this.requireItem(id);
    const updated = item.revokeConsent(input);
    await this.repository.save(updated);
    return updated.toView();
  }

  /** PRT-WEB-02 / PRT-MOB-01: публічна проєкція — лише опубліковане. */
  async publicGallery(barberId: string): Promise<PortfolioView[]> {
    const items = await this.repository.list();
    return items
      .filter((item) => item.barberId === barberId && item.status === 'published')
      .sort(
        (a, b) =>
          (b.toView().publishedAt?.getTime() ?? 0) - (a.toView().publishedAt?.getTime() ?? 0)
      )
      .map((item) => item.toView());
  }

  /** PRT-ADM-01: черга модерації або вся дошка. */
  async listForAdmin(status?: PublicationStatus): Promise<PortfolioView[]> {
    const items = await this.repository.list();
    return items
      .filter((item) => status === undefined || item.status === status)
      .sort((a, b) => b.toView().createdAt.getTime() - a.toView().createdAt.getTime())
      .map((item) => item.toView());
  }

  /** PRT-002/PRT-ADM-02: публікація після згоди клієнта і модерації адміна. */
  async publish(id: string, input: PublishInput): Promise<PortfolioView> {
    const item = await this.requireItem(id);
    const updated = item.publish(input);
    await this.repository.save(updated);
    return updated.toView();
  }

  /** PRT-ADM-02 / PRT-BAR-03: приховування з причиною. */
  async hide(id: string, input: ModerationInput): Promise<PortfolioView> {
    const item = await this.requireItem(id);
    const updated = item.hide(input);
    await this.repository.save(updated);
    return updated.toView();
  }

  /** Журнал згоди: хто/коли/як — доказ для модерації (PRT-ADM-02). */
  async consentJournal(id: string): Promise<ConsentJournalEntry[]> {
    const item = await this.requireItem(id);
    return item.consentJournal();
  }

  private async requireItem(id: string): Promise<PortfolioItem> {
    const item = await this.repository.findById(id);
    if (!item) throw new PortfolioError(`Portfolio item ${id} not found`);
    return item;
  }
}
