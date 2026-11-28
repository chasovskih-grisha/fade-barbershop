// T-4850: повний публічний payload локації — спільна фікстура тестів екрана
// майстра. Порожні колекції: тест перевіряє лише майстра, не розклад чи крісла.
import type { LocationDto } from '../../../../lib/api/locations';

export const locationFixture = (overrides: Partial<LocationDto> = {}): LocationDto => ({
  id: 'loc-1',
  code: 'clt-01',
  name: 'FADE Central',
  address: 'Тепла, 5',
  addressParts: null,
  lat: 50.44,
  lng: 30.49,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
  ...overrides,
});
