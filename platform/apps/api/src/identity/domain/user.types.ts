// Типи User — окремо від агрегату (max-lines).

import type { PhoneNumber } from './phone-number';
import type { Role } from './role';

export interface UserData {
  id: string;
  phone: PhoneNumber;
  role: Role;
  name: string | null;
  /** T-4422: адреса сповіщень безпеки; null — не задано. */
  email: string | null;
  active: boolean;
  selfSchedule: boolean;
  username: string | null;
  passwordHash: string | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
}

export type CreateUserInput = Partial<
  Pick<
    UserData,
    'name' | 'email' | 'active' | 'selfSchedule' | 'username' | 'passwordHash' | 'phoneVerifiedAt'
  >
> &
  Pick<UserData, 'id' | 'phone' | 'role' | 'createdAt'>;

/** Нормалізувати вхід створення: опційні поля → null-дефолти (ADR 0005). */
export function newUserData(input: CreateUserInput): UserData {
  return {
    id: input.id,
    phone: input.phone,
    role: input.role,
    name: input.name ?? null,
    email: input.email ?? null,
    active: input.active ?? true,
    selfSchedule: input.selfSchedule ?? false,
    username: input.username ?? null,
    passwordHash: input.passwordHash ?? null,
    phoneVerifiedAt: input.phoneVerifiedAt ?? null,
    createdAt: input.createdAt,
  };
}
