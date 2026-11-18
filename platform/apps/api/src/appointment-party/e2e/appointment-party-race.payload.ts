// Пейлоади POST /admin/appointment-parties для race-e2e: sequential 90 хв
// або parallel 50+45 зі спільним стартом (PARTY-003/005, ADR 0011).

import { uuidv7 } from '@fade/domain-shared';
import { DATE, type PartyWorld } from './appointment-party-race.fixtures';

const uid = () => uuidv7();

export function partyPayload(
  world: PartyWorld,
  input: { locationId: string; mode: 'sequential' | 'parallel'; father: string; son: string }
) {
  const slots = {
    sequential: [{ start: `${DATE}T10:00:00.000Z`, end: `${DATE}T11:30:00.000Z` }],
    parallel: [
      { start: `${DATE}T10:00:00.000Z`, end: `${DATE}T10:50:00.000Z` },
      { start: `${DATE}T10:00:00.000Z`, end: `${DATE}T10:45:00.000Z` },
    ],
  } as const;
  const leg = (role: 'father' | 'son', barberId: string) => ({
    id: uid(),
    role,
    name: role === 'father' ? 'Олег' : 'Тарас',
    age: role === 'father' ? 38 : 9,
    barberId,
  });
  return {
    date: DATE,
    locationId: input.locationId,
    serviceId: world.service,
    mode: input.mode,
    barberIds: [input.father, input.son],
    slots: slots[input.mode],
    partyLegs: [leg('father', input.father), leg('son', input.son)],
  };
}
