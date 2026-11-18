// Хелпери спеки admin-account (T-4411) — окремий файл: max-lines спеки +
// coveragePathIgnorePatterns (*/**/*.fakes.ts).
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { FakeLoginAudit } from './login-audit.fakes';
import type { AdminAccountDeps } from './admin-account';
import { uuidv7 } from '@fade/domain-shared';

export const NOW = new Date('2026-09-27T10:00:00.000Z');
const PHONE = PhoneNumber.of('+380501111111');

export const adminUser = (
  id: string,
  role: 'admin' | 'client' = 'admin',
  hash: string | null = 'scrypt:x:y'
) =>
  User.create({
    id,
    phone: PHONE,
    role,
    name: id,
    active: true,
    selfSchedule: false,
    username: id,
    passwordHash: hash,
    createdAt: NOW,
  });

export interface Harness {
  users: Map<string, User>;
  saved: User[];
  revoked: string[];
  events: Array<{ type: string; payload: Record<string, unknown> }>;
  auditRows: Array<{ userId: string; username: string; ok: boolean }>;
  deps: AdminAccountDeps;
}

export const expectError = async (p: Promise<unknown>, ctor: new (...a: never[]) => Error) => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ctor);
    return;
  }
  throw new Error(`expected ${ctor.name}`);
};

export function harness(): Harness {
  const users = new Map<string, User>();
  const saved: User[] = [];
  const revoked: string[] = [];
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const auditRows: Array<{ userId: string; username: string; ok: boolean }> = [];
  const audit = new FakeLoginAudit();
  audit.record = async (userId, attempt) => {
    auditRows.push({ userId, username: attempt.username, ok: attempt.ok });
  };
  return {
    users,
    saved,
    revoked,
    events,
    auditRows,
    deps: {
      users: {
        findById: async (id) => users.get(id) ?? null,
        findByPhone: async () => null,
        findByUsername: async () => null,
        findByEmail: async () => null,
        listByRole: async () => [],
        save: async (u) => {
          users.set(u.id, u);
          saved.push(u);
        },
      },
      sessions: {
        revokeAllForUser: async (userId) => {
          revoked.push(userId);
          return 2;
        },
        save: async () => undefined,
        findByTokenHash: async () => null,
        findByRefreshHash: async () => null,
        findActiveByUser: async () => [],
        rotateTokens: async () => 0,
      },
      outbox: {
        append: async (list) => {
          for (const e of list) events.push(e);
        },
      },
      clock: { now: () => NOW },
      ids: { id: () => uuidv7() },
      uow: { run: async <T>(work: () => Promise<T>) => work() },
      audit,
    },
  };
}
