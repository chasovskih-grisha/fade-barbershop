// Спільний setup для crm-handlers specs.

import { ClientProfile } from '../domain/client-profile';
import type { ClientId } from '../domain/client-profile.types';
import type {
  ClientProfileRepository,
  ClientProfileListFilters,
} from '../domain/client-profile.repository';
import type { CrmCommandContext } from './crm-ports';

const T0 = new Date('2026-09-29T10:00:00.000Z');

function profile(): ClientProfile {
  return ClientProfile.reconstitute({
    id: 'p-1' as ClientId,
    userId: 'u-1',
    name: 'Олег',
    phone: '+380671111111',
    preferences: [],
    notes: [],
    vipDiscountPercent: 10,
    loyaltyVisitsCount: 2,
    createdAt: T0,
    updatedAt: T0,
  });
}

class MemProfiles implements ClientProfileRepository {
  store = new Map<string, ClientProfile>();
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findByUserId() {
    return null;
  }
  async findByPhone() {
    return null;
  }
  async save(p: ClientProfile) {
    this.store.set(p.id, p);
  }
  async list(_f?: ClientProfileListFilters) {
    return [...this.store.values()];
  }
}

export function crmHandlersSetup() {
  const profiles = new MemProfiles();
  profiles.store.set('p-1', profile());
  const events: Array<{ type: string; payload: unknown }> = [];
  const ctx: CrmCommandContext = {
    profiles,
    outbox: {
      append: async (es) => {
        events.push(...es.map((e) => ({ type: e.type, payload: e.payload })));
      },
    },
    clock: { now: () => T0 },
    ids: {
      id: (() => {
        let n = 0;
        return () => `id-${++n}`;
      })(),
    },
    uow: { run: async (work) => work() },
  };
  return { profiles, events, ctx };
}
