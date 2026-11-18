// DI-стенд контролера клієнтського профілю для специфікації: фейковий репозиторій
// профілів, CRM-хендлери і контролер з допуском за сесією. Окремо від спеки — гейт max-lines.
import { ClientProfileController } from './client-profile.controller';
import { ClientBirthdayController } from './client-birthday.controller';
import {
  UpdateClientProfileHandler,
  UpdateBirthdayHandler,
  UpdatePreferencesHandler,
  GetClientProfileByUserIdHandler,
} from '../../crm/application/crm-handlers';
import type { ClientProfileRepository } from '../../crm/domain/client-profile.repository';
import type { CrmCommandContext } from '../../crm/application/crm-ports';
import { ClientProfile } from '../../crm/domain/client-profile';
import { uuidv7 } from '@fade/domain-shared';
import type { ClientId } from '../../crm/domain/client-profile.types';
import type { ClientSession } from './client-session.guard';
import { PROFILE_1, SESSION_1, USER_CLIENT } from '../application/test-ids';

const T0 = new Date('2026-09-29T10:00:00.000Z');

function clientProfile(profileId: string, userId: string): ClientProfile {
  return ClientProfile.reconstitute({
    id: profileId as ClientId,
    userId,
    name: 'Олег',
    phone: '+380671111111',
    preferences: [],
    notes: [],
    vipDiscountPercent: null,
    loyaltyVisitsCount: 2,
    createdAt: T0,
    updatedAt: T0,
  });
}

export class FakeProfilesRepo implements ClientProfileRepository {
  store = new Map<string, ClientProfile>();
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findByUserId(userId: string) {
    for (const p of this.store.values()) {
      if (p.userId === userId) return p;
    }
    return null;
  }
  async findByPhone() {
    return null;
  }
  async save(p: ClientProfile) {
    this.store.set(p.id, p);
  }
  async list() {
    return [...this.store.values()];
  }
}

export interface ClientProfileControllerEnv {
  profiles: FakeProfilesRepo;
  events: Array<{ type: string; payload: unknown }>;
  ctx: CrmCommandContext;
  controller: ClientProfileController;
  birthday: ClientBirthdayController;
  session: ClientSession;
}

export function makeClientProfileController(): ClientProfileControllerEnv {
  const profiles = new FakeProfilesRepo();
  const userId = USER_CLIENT;
  profiles.store.set(PROFILE_1, clientProfile(PROFILE_1, userId));
  const events: Array<{ type: string; payload: unknown }> = [];
  const ctx: CrmCommandContext = {
    profiles,
    outbox: {
      append: async (es) => {
        events.push(...es.map((e) => ({ type: e.type, payload: e.payload })));
      },
    },
    clock: { now: () => T0 },
    ids: { id: () => uuidv7() },
    uow: { run: async (work) => work() },
  };
  const handlers = {
    getProfileByUserId: new GetClientProfileByUserIdHandler(profiles),
    updateProfile: new UpdateClientProfileHandler(ctx),
    updateBirthday: new UpdateBirthdayHandler(ctx),
    updatePreferences: new UpdatePreferencesHandler(ctx),
  };
  const controller = new ClientProfileController(handlers as never);
  const birthday = new ClientBirthdayController(handlers as never);
  const session: ClientSession = { userId, sessionId: SESSION_1 };
  return { profiles, events, ctx, controller, birthday, session };
}
