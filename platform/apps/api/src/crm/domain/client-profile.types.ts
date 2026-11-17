// VO-типи картки гостя (crm): вподобання, нотатки, вхід агрегата.
// Брендінг ClientId закриває контракт порту: raw string ззовні не проходить у
// агрегат без явного перетворення (toClientId). Це блокирує той самий клас
// помилок, що описані в SCRATCHPAD.md.
import type { Clock, IdGenerator } from './ports';
import { ClientProfile } from './client-profile';

export type ClientId = string & { readonly _brand: unique symbol };

export function toClientId(raw: string): ClientId {
  return raw as unknown as ClientId;
}

export interface Preference {
  id: string;
  text: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  text: string;
  authorId: string;
  authorRole: 'barber' | 'admin';
  visibleToClient: boolean;
  createdAt: Date;
}

/** Вхід для додавання нотатки: visibleToClient за замовчуванням false. */
export interface AddNoteInput {
  text: string;
  authorId: string;
  authorRole: 'barber' | 'admin';
  visibleToClient?: boolean;
}

/** День народження без року (T-4730): місяць 1–12, день 1–31. */
export interface Birthday {
  day: number;
  month: number;
}

export interface ClientProfileProps {
  id: ClientId;
  userId: string;
  name: string | null;
  phone: string;
  /** Необов'язковий день і місяць народження (T-4730); порожнє — дефолт. */
  birthday?: Birthday | null;
  inviteCode: string;
  referredBy: string | null;
  preferences: Preference[];
  notes: Note[];
  vipDiscountPercent: number | null;
  loyaltyVisitsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Фабрика профілю при першій реєстрації (поруч з агрегатом, без циклів). */
export function createClientProfile(
  props: {
    userId: string;
    phone: string;
    name: string | null;
    inviteCode?: string;
    referredBy?: string | null;
  },
  clock: Clock,
  ids: IdGenerator
): { profile: ClientProfile; registeredAt: Date; clientId: ClientId } {
  const now = clock.now();
  const id = ids.id() as ClientId;
  const inviteCode =
    props.inviteCode || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const profile = ClientProfile.reconstitute({
    id,
    userId: props.userId,
    name: props.name,
    phone: props.phone,
    birthday: null,
    inviteCode,
    referredBy: props.referredBy ?? null,
    preferences: [],
    notes: [],
    vipDiscountPercent: null,
    loyaltyVisitsCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return { profile, registeredAt: now, clientId: id };
}
