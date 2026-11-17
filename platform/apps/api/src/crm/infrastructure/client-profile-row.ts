// Row-типи Prisma і мапери ClientProfile ↔ рядок (crm). Ізольовані в окремому
// файлі: репозиторій читається як порт-адаптер, мапінг — як механіка.
import type { Prisma } from '@prisma/client';
import { ClientProfile } from '../domain/client-profile';
import type {
  Birthday,
  ClientId,
  ClientProfileProps,
  Note,
  Preference,
} from '../domain/client-profile.types';

/** День і місяць з рядка БД; неповна пара — порожнє значення. */
function toBirthday(day: number | null, month: number | null): Birthday | null {
  return day !== null && month !== null ? { day, month } : null;
}

interface PrPreference {
  id: string;
  clientId: string;
  text: string;
  createdAt: Date;
}

interface PrNote {
  id: string;
  clientId: string;
  text: string;
  authorId: string;
  authorRole: 'barber' | 'admin';
  visibleToClient: boolean;
  createdAt: Date;
}

export interface PrClientProfile {
  id: string;
  userId: string;
  name: string | null;
  phone: string;
  birthDay: number | null;
  birthMonth: number | null;
  inviteCode: string;
  referredBy: string | null;
  preferences: unknown;
  notes: unknown;
  vipDiscountPercent: number | null;
  loyaltyVisitsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toDomainProfile(data: PrClientProfile): ClientProfile {
  return ClientProfile.reconstitute({
    id: data.id as ClientId,
    userId: data.userId,
    name: data.name,
    phone: data.phone,
    birthday: toBirthday(data.birthDay, data.birthMonth),
    inviteCode: data.inviteCode ?? `REF-${data.id.substring(0, 6).toUpperCase()}`,
    referredBy: data.referredBy ?? null,
    preferences: (Array.isArray(data.preferences) ? data.preferences : []).map((p) => {
      const pr = p as PrPreference;
      return { id: pr.id, text: pr.text, createdAt: new Date(pr.createdAt) };
    }),
    notes: (Array.isArray(data.notes) ? data.notes : []).map((n) => {
      const pr = n as PrNote;
      return {
        id: pr.id,
        text: pr.text,
        authorId: pr.authorId,
        authorRole: pr.authorRole,
        visibleToClient: pr.visibleToClient,
        createdAt: new Date(pr.createdAt),
      };
    }),
    vipDiscountPercent: data.vipDiscountPercent,
    loyaltyVisitsCount: data.loyaltyVisitsCount,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

export function toPrismaProfile(
  props: ClientProfileProps
): Prisma.ClientProfileUncheckedCreateInput {
  return {
    id: props.id,
    userId: props.userId,
    name: props.name,
    phone: props.phone,
    birthDay: props.birthday?.day ?? null,
    birthMonth: props.birthday?.month ?? null,
    inviteCode: props.inviteCode,
    referredBy: props.referredBy,
    preferences: props.preferences as unknown as Prisma.InputJsonValue[],
    notes: props.notes as unknown as Prisma.InputJsonValue[],
    vipDiscountPercent: props.vipDiscountPercent,
    loyaltyVisitsCount: props.loyaltyVisitsCount,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}

export type { Preference, Note };
