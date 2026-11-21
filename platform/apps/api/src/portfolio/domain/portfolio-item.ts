/* eslint-disable max-lines, complexity -- cohesive module (319 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 18 vs 10); refactor tracked in T-2500f */
/**
 * T-190: чиста модель публічної галереї «до/після» (без Nest, без Prisma).
 *
 * Правила `docs/acceptance-criteria/15-public-gallery.md`:
 *  - PRT-001: елемент — пара «до/після» (до = фото з крісла або AI-варіант)
 *    або одиночне «після»; до 2 фото «після»;
 *  - PRT-002: згода **двошарова** — opt-in клієнта І модерація адміна;
 *    відмітка барбера в кріслі — лише фіксація усної згоди, не публікація;
 *  - PRT-006: `pending_consent → pending_review → published / hidden`;
 *    відкликання згоди ховає елемент **миттєво**;
 *  - PRT-007: AI-елемент позначений бейджем «AI-підбір → результат».
 *
 * Публічна проєкція (`toView`) — **копія** без персональних даних клієнта
 * (патерн ADR 0015 §3): сторінки не отримують ні id клієнта, ні візиту.
 */

export type PublicationStatus = 'pending_consent' | 'pending_review' | 'published' | 'hidden';

export type PortfolioActorRole = 'barber' | 'admin' | 'client';

export type ConsentOpinion = 'yes' | 'anonymous' | 'no';

export type ConsentObtainedVia = 'optin_screen' | 'barber_chair' | 'admin';

export type PortfolioPhotoKind = 'before' | 'after' | 'ai';

/** Максимум фото «після» на елемент (15-public-gallery.md, відкрите питання 3). */
export const MAX_AFTER_PHOTOS = 2;

export const MAX_CAPTION_LENGTH = 280;

export class PortfolioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioError';
  }
}

/** Стан елемента не дозволяє дію (немає згоди, вже опубліковано тощо). */
export class PortfolioConflictError extends PortfolioError {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioConflictError';
  }
}

/** Роль актора не має права на дію (публікує лише адмін). */
export class PortfolioForbiddenError extends PortfolioError {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioForbiddenError';
  }
}

export interface ClientConsent {
  opinion: ConsentOpinion;
  obtainedVia: ConsentObtainedVia;
  at: Date;
  by: string;
}

export interface PortfolioPhotoInput {
  url: string;
  kind?: PortfolioPhotoKind;
  caption?: string | null;
}

export interface PortfolioPhoto {
  url: string;
  kind: PortfolioPhotoKind;
}

export interface ConsentJournalEntry {
  at: Date;
  by: string;
  action: 'granted' | 'recorded_verbally' | 'refused' | 'revoked';
  opinion: ConsentOpinion;
  obtainedVia: ConsentObtainedVia;
}

export interface PortfolioConsentInput {
  opinion: ConsentOpinion;
  obtainedVia: ConsentObtainedVia;
  by: string;
  at?: Date;
}

export interface CreatePortfolioItemInput {
  id: string;
  barberId: string;
  category: string;
  caption?: string | null;
  tags?: string[];
  before?: PortfolioPhotoInput | null;
  after: PortfolioPhotoInput[];
  consent?: Omit<ClientConsent, 'at' | 'by'> & { by: string; at?: Date };
  at: Date;
}

/** Публічна проєкція: копія для сайту, mobile і барбер-додатка. */
export interface PortfolioView {
  id: string;
  barberId: string;
  category: string;
  caption?: string;
  tags: string[];
  before?: PortfolioPhoto;
  after: PortfolioPhoto[];
  status: PublicationStatus;
  consent?: { opinion: ConsentOpinion; obtainedVia: ConsentObtainedVia; at: Date };
  publishedAt?: Date;
  hiddenReason?: string;
  /** PRT-007: бейдж «AI-підбір → результат» обов'язковий для AI-джерела. */
  aiBadge: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioItemState {
  id: string;
  barberId: string;
  category: string;
  caption?: string;
  tags: string[];
  before?: PortfolioPhoto;
  after: PortfolioPhoto[];
  consent?: ClientConsent;
  status: PublicationStatus;
  publishedAt?: Date;
  hiddenReason?: string;
  consentJournal: ConsentJournalEntry[];
  createdAt: Date;
  updatedAt: Date;
}

function normalizePhoto(
  photo: PortfolioPhotoInput,
  fallbackKind: PortfolioPhotoKind
): PortfolioPhoto {
  const url = typeof photo?.url === 'string' ? photo.url.trim() : '';
  if (!url) throw new PortfolioError('Photo url is required');
  return { url, kind: photo.kind ?? fallbackKind };
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))];
}

function journalAction(consent: ClientConsent): ConsentJournalEntry['action'] {
  if (consent.opinion === 'no') return 'refused';
  return consent.obtainedVia === 'barber_chair' ? 'recorded_verbally' : 'granted';
}

/**
 * PRT-002/PRT-006: статус після фіксації згоди.
 *
 * Усна згода в кріслі публікації не дає — елемент лишається `pending_consent`,
 * доки клієнт не підтвердить opt-in. Відмова одразу ховає елемент.
 */
export function statusForConsent(consent: ClientConsent | undefined): PublicationStatus {
  if (!consent) return 'pending_consent';
  if (consent.opinion === 'no') return 'hidden';
  if (consent.obtainedVia === 'barber_chair') return 'pending_consent';
  return 'pending_review';
}

/** Чи можна публікувати елемент із такою згодою (PRT-002). */
export function hasPublishableConsent(consent: ClientConsent | undefined): boolean {
  if (!consent) return false;
  if (consent.opinion === 'no') return false;
  return consent.obtainedVia !== 'barber_chair';
}

export class PortfolioItem {
  private constructor(private readonly state: PortfolioItemState) {}

  static create(input: CreatePortfolioItemInput): PortfolioItem {
    const barberId = input.barberId?.trim();
    if (!barberId) throw new PortfolioError('Barber id is required');

    const category = input.category?.trim();
    if (!category) throw new PortfolioError('Category is required');

    const after = (input.after ?? []).map((photo) => normalizePhoto(photo, 'after'));
    if (after.length === 0) throw new PortfolioError('At least one after photo is required');
    if (after.length > MAX_AFTER_PHOTOS) {
      throw new PortfolioError(`At most ${MAX_AFTER_PHOTOS} after photos are allowed`);
    }

    const caption = typeof input.caption === 'string' ? input.caption.trim() : undefined;
    if (caption !== undefined && caption.length > MAX_CAPTION_LENGTH) {
      throw new PortfolioError(`Caption must be ≤ ${MAX_CAPTION_LENGTH} characters`);
    }

    const consent: ClientConsent | undefined = input.consent
      ? {
          opinion: input.consent.opinion,
          obtainedVia: input.consent.obtainedVia,
          by: input.consent.by,
          at: input.consent.at ?? input.at,
        }
      : undefined;

    const before =
      input.before === undefined || input.before === null
        ? undefined
        : normalizePhoto(input.before, 'before');

    const status = statusForConsent(consent);

    const state: PortfolioItemState = {
      id: input.id,
      barberId,
      category,
      tags: normalizeTags(input.tags),
      after,
      status,
      consentJournal: consent
        ? [
            {
              at: consent.at,
              by: consent.by,
              action: journalAction(consent),
              opinion: consent.opinion,
              obtainedVia: consent.obtainedVia,
            },
          ]
        : [],
      createdAt: input.at,
      updatedAt: input.at,
    };
    if (caption) state.caption = caption;
    if (before) state.before = before;
    if (consent) state.consent = consent;
    if (status === 'hidden') state.hiddenReason = 'Client declined publication';

    return new PortfolioItem(state);
  }

  static restore(state: PortfolioItemState): PortfolioItem {
    return new PortfolioItem(state);
  }

  get id(): string {
    return this.state.id;
  }

  get barberId(): string {
    return this.state.barberId;
  }

  get status(): PublicationStatus {
    return this.state.status;
  }

  /** PRT-007: елемент побудований на AI-варіанті. */
  get hasAiSource(): boolean {
    return (
      this.state.before?.kind === 'ai' || this.state.after.some((photo) => photo.kind === 'ai')
    );
  }

  /**
   * Фіксація згоди клієнта (PRT-002/PRT-BAR-02).
   *
   * Перехід: opt-in → `pending_review`; усна згода в кріслі → лишається
   * `pending_consent`; відмова → `hidden` негайно.
   */
  recordConsent(input: PortfolioConsentInput): PortfolioItem {
    const at = input.at ?? new Date();
    const consent: ClientConsent = {
      opinion: input.opinion,
      obtainedVia: input.obtainedVia,
      by: input.by,
      at,
    };
    const status = statusForConsent(consent);

    const state: PortfolioItemState = {
      ...this.state,
      consent,
      consentJournal: [
        ...this.state.consentJournal,
        {
          at,
          by: input.by,
          action: journalAction(consent),
          opinion: consent.opinion,
          obtainedVia: consent.obtainedVia,
        },
      ],
      updatedAt: at,
    };

    if (status === 'hidden') {
      state.status = 'hidden';
      state.hiddenReason = 'Client declined publication';
    } else if (this.state.status === 'published') {
      // Опублікований елемент із підтвердженою згодою лишається опублікованим.
      state.status = 'published';
    } else {
      state.status = status;
    }

    return new PortfolioItem(state);
  }

  /** Відкликання згоди клієнтом: миттєве приховування (PRT-006). */
  revokeConsent(input: { by: string; at?: Date }): PortfolioItem {
    const consent = this.state.consent;
    if (!consent) throw new PortfolioConflictError('Item has no recorded consent to revoke');

    const at = input.at ?? new Date();
    return new PortfolioItem({
      ...this.state,
      status: 'hidden',
      hiddenReason: 'Consent revoked',
      consentJournal: [
        ...this.state.consentJournal,
        {
          at,
          by: input.by,
          action: 'revoked',
          opinion: consent.opinion,
          obtainedVia: consent.obtainedVia,
        },
      ],
      updatedAt: at,
    });
  }

  /** Публікація: лише адмін і лише за згодою клієнта (PRT-002/PRT-BAR-03). */
  publish(input: { by: string; role: PortfolioActorRole; at?: Date }): PortfolioItem {
    if (input.role !== 'admin') {
      throw new PortfolioForbiddenError('Only an admin can publish a portfolio item');
    }
    if (!hasPublishableConsent(this.state.consent)) {
      throw new PortfolioConflictError('Client consent is required before publishing');
    }
    if (this.state.status === 'published') return this;

    const at = input.at ?? new Date();
    return new PortfolioItem({
      ...this.state,
      status: 'published',
      publishedAt: at,
      updatedAt: at,
    });
  }

  /** Приховування адміном або власником-барбером (PRT-BAR-03, PRT-ADM-02). */
  hide(input: { by: string; role: PortfolioActorRole; reason: string; at?: Date }): PortfolioItem {
    if (input.role !== 'admin' && input.role !== 'barber') {
      throw new PortfolioForbiddenError('Only an admin or the barber can hide a portfolio item');
    }
    const reason = input.reason?.trim();
    if (!reason) throw new PortfolioError('Hide reason is required');

    const at = input.at ?? new Date();
    return new PortfolioItem({
      ...this.state,
      status: 'hidden',
      hiddenReason: reason,
      consentJournal: this.state.consentJournal,
      updatedAt: at,
    });
  }

  /** Публічна проєкція — копія без персональних даних клієнта. */
  toView(): PortfolioView {
    const view: PortfolioView = {
      id: this.state.id,
      barberId: this.state.barberId,
      category: this.state.category,
      tags: [...this.state.tags],
      after: this.state.after.map((photo) => ({ ...photo })),
      status: this.state.status,
      aiBadge: this.hasAiSource,
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt,
    };
    if (this.state.caption !== undefined) view.caption = this.state.caption;
    if (this.state.before) view.before = { ...this.state.before };
    if (this.state.consent) {
      view.consent = {
        opinion: this.state.consent.opinion,
        obtainedVia: this.state.consent.obtainedVia,
        at: this.state.consent.at,
      };
    }
    if (this.state.publishedAt) view.publishedAt = this.state.publishedAt;
    if (this.state.hiddenReason) view.hiddenReason = this.state.hiddenReason;
    return view;
  }

  consentJournal(): ConsentJournalEntry[] {
    return this.state.consentJournal.map((entry) => ({ ...entry }));
  }

  toState(): PortfolioItemState {
    return {
      ...this.state,
      tags: [...this.state.tags],
      after: this.state.after.map((photo) => ({ ...photo })),
      consentJournal: this.consentJournal(),
    };
  }
}
