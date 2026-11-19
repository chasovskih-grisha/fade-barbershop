/**
 * T-4455: портфоліо барбера — завантаження фото «до/після» з пристрою.
 *
 * Правила (README `portfolio`, AC 15-public-gallery):
 *  - елемент завжди має хоча б одне фото «після»; «до» — опційне;
 *  - категорія обмежена (`haircut` / `beard`), теги нормалізуються;
 *  - публікація двошарова: згода клієнта + рішення адміна з правом публікації;
 *  - без згоди елемент лишається `pending_consent` і в галерею не потрапляє;
 *  - відкликання згоди ховає елемент негайно (без участі адміна).
 *
 * Чистий модуль: без Nest, Prisma і HTTP. Час передається явно.
 */

export type PortfolioCategory = 'haircut' | 'beard';
export type PortfolioPhotoKind = 'before' | 'after';
export type PublicationStatus = 'pending_consent' | 'pending_review' | 'published' | 'hidden';
export type PortfolioActorRole = 'barber' | 'admin' | 'client';

/** Згода клієнта: названо / анонімно без обличчя / немає. */
export type ClientConsentOpinion = 'named' | 'anonymous' | 'none';
export type ConsentObtainedVia = 'opt_in_screen' | 'in_chair';

export interface PortfolioPhoto {
  objectKey: string;
  kind: PortfolioPhotoKind;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface ClientConsent {
  opinion: ClientConsentOpinion;
  obtainedVia: ConsentObtainedVia;
  by: string;
  at: Date;
  revokedAt?: Date;
}

export interface PortfolioItem {
  id: string;
  barberId: string;
  category: PortfolioCategory;
  caption: string | null;
  tags: string[];
  before: PortfolioPhoto | null;
  after: PortfolioPhoto[];
  consent: ClientConsent | null;
  status: PublicationStatus;
  createdAt: Date;
  publishedAt: Date | null;
  hiddenReason: string | null;
}

export class PortfolioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioError';
  }
}

export class PortfolioForbiddenError extends PortfolioError {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioForbiddenError';
  }
}

export class PortfolioConflictError extends PortfolioError {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioConflictError';
  }
}

export const PORTFOLIO_CATEGORIES: readonly PortfolioCategory[] = ['haircut', 'beard'];
export const MAX_PORTFOLIO_TAGS = 5;
export const MAX_PORTFOLIO_TAG_LENGTH = 24;
export const MAX_PORTFOLIO_CAPTION = 200;
export const MAX_PORTFOLIO_AFTER_PHOTOS = 4;

function normalizePhoto(
  photo: { objectKey: string; alt?: string; width?: number | null; height?: number | null },
  kind: PortfolioPhotoKind
): PortfolioPhoto {
  const objectKey = photo.objectKey.trim();
  if (!objectKey) throw new PortfolioError('Photo object key is required');

  const alt = (photo.alt ?? '').trim();
  if (alt.length > 120) throw new PortfolioError('Photo alt text must be ≤ 120 characters');

  return {
    objectKey,
    kind,
    alt,
    width: photo.width ?? null,
    height: photo.height ?? null,
  };
}

/** Теги: нижній регістр, без #, унікальні, не більше п’яти. */
export function normalizePortfolioTags(tags: readonly string[] = []): string[] {
  const normalized: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '').toLowerCase();
    if (!tag) continue;
    if (tag.length > MAX_PORTFOLIO_TAG_LENGTH) {
      throw new PortfolioError(`Tag "${raw}" is longer than ${MAX_PORTFOLIO_TAG_LENGTH}`);
    }
    if (!normalized.includes(tag)) normalized.push(tag);
  }
  if (normalized.length > MAX_PORTFOLIO_TAGS) {
    throw new PortfolioError(`At most ${MAX_PORTFOLIO_TAGS} tags are allowed`);
  }
  return normalized;
}

/**
 * Додає елемент портфоліо. Публікувати одразу не можна: статус залежить
 * від наявної згоди (`pending_consent` без неї, `pending_review` з нею).
 */
export function addPortfolioItem(input: {
  id: string;
  barberId: string;
  category: string;
  caption?: string | null;
  tags?: readonly string[];
  before?: {
    objectKey: string;
    alt?: string;
    width?: number | null;
    height?: number | null;
  } | null;
  after: Array<{
    objectKey: string;
    alt?: string;
    width?: number | null;
    height?: number | null;
  }>;
  consent?: ClientConsent | null;
  at: Date;
}): PortfolioItem {
  if (!input.id.trim()) throw new PortfolioError('Portfolio item id is required');
  if (!input.barberId.trim()) throw new PortfolioError('Barber id is required');

  if (!(PORTFOLIO_CATEGORIES as readonly string[]).includes(input.category)) {
    throw new PortfolioError(`Unknown portfolio category: ${input.category}`);
  }

  if (input.after.length === 0) throw new PortfolioError('At least one after photo is required');
  if (input.after.length > MAX_PORTFOLIO_AFTER_PHOTOS) {
    throw new PortfolioError(`At most ${MAX_PORTFOLIO_AFTER_PHOTOS} after photos are allowed`);
  }

  const caption = (input.caption ?? '').trim();
  if (caption.length > MAX_PORTFOLIO_CAPTION) {
    throw new PortfolioError(`Caption must be ≤ ${MAX_PORTFOLIO_CAPTION} characters`);
  }

  const consent = input.consent ?? null;
  if (consent && consent.opinion !== 'none' && !consent.by.trim()) {
    throw new PortfolioError('Consent author is required');
  }

  return {
    id: input.id,
    barberId: input.barberId.trim(),
    category: input.category as PortfolioCategory,
    caption: caption.length > 0 ? caption : null,
    tags: normalizePortfolioTags(input.tags),
    before: input.before ? normalizePhoto(input.before, 'before') : null,
    after: input.after.map((photo) => normalizePhoto(photo, 'after')),
    consent,
    status: consent && consent.opinion !== 'none' ? 'pending_review' : 'pending_consent',
    createdAt: input.at,
    publishedAt: null,
    hiddenReason: null,
  };
}

/** Фіксує/оновлює згоду клієнта й переводить елемент на модерацію. */
export function recordClientConsent(
  item: PortfolioItem,
  consent: ClientConsent
): PortfolioItem {
  if (item.status === 'published') {
    throw new PortfolioConflictError('Published item cannot change consent; revoke it instead');
  }
  if (item.status === 'hidden') {
    throw new PortfolioConflictError('Hidden item cannot change consent');
  }
  if (!consent.by.trim()) throw new PortfolioError('Consent author is required');
  if (consent.obtainedVia === 'in_chair' && consent.opinion === 'named') {
    // Відмітка барбера в кріслі не є публікацією з ім’ям: лише анонімно.
    return {
      ...item,
      consent: { ...consent, opinion: 'anonymous' },
      status: 'pending_review',
    };
  }

  return {
    ...item,
    consent,
    status: consent.opinion === 'none' ? 'pending_consent' : 'pending_review',
  };
}

/** Публікація: лише адмін і лише за наявної згоди клієнта. */
export function publishPortfolioItem(
  item: PortfolioItem,
  input: { by: string; role: PortfolioActorRole; at: Date }
): PortfolioItem {
  if (input.role !== 'admin') {
    throw new PortfolioForbiddenError('Only an admin can publish portfolio items');
  }
  if (!input.by.trim()) throw new PortfolioError('Publisher is required');
  if (!item.consent || item.consent.opinion === 'none' || item.consent.revokedAt) {
    throw new PortfolioConflictError('Client consent is required before publishing');
  }
  if (item.status === 'published') {
    throw new PortfolioConflictError('Portfolio item is already published');
  }
  if (item.status !== 'pending_review') {
    throw new PortfolioConflictError(`Cannot publish an item in status ${item.status}`);
  }

  return { ...item, status: 'published', publishedAt: input.at, hiddenReason: null };
}

/** Приховування адміном: причина обов’язкова, елемент зникає з дошки одразу. */
export function hidePortfolioItem(
  item: PortfolioItem,
  input: { by: string; role: PortfolioActorRole; reason: string; at: Date }
): PortfolioItem {
  if (input.role !== 'admin') {
    throw new PortfolioForbiddenError('Only an admin can hide portfolio items');
  }
  if (!input.by.trim()) throw new PortfolioError('Moderator is required');
  const reason = input.reason.trim();
  if (!reason) throw new PortfolioError('Hide reason is required');
  if (item.status === 'hidden') return item;

  return {
    ...item,
    status: 'hidden',
    hiddenReason: reason,
    publishedAt: item.publishedAt,
  };
}

/** Відкликання згоди клієнтом: миттєве приховування, без рішення адміна. */
export function revokeClientConsent(
  item: PortfolioItem,
  input: { by: string; at: Date }
): PortfolioItem {
  if (!input.by.trim()) throw new PortfolioError('Consent revocation author is required');
  if (!item.consent) throw new PortfolioConflictError('Item has no consent to revoke');

  return {
    ...item,
    consent: { ...item.consent, opinion: 'none', revokedAt: input.at },
    status: 'hidden',
    hiddenReason: 'client_consent_revoked',
  };
}

/** Публічна галерея барбера: лише опубліковані елементи. */
export function publishedForBarber(items: PortfolioItem[], barberId: string): PortfolioItem[] {
  return items.filter((item) => item.barberId === barberId && item.status === 'published');
}
