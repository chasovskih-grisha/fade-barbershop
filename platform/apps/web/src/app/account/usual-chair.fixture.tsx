import { screen } from '@testing-library/react';

// Спільний двійник мережі для спеків картки звичного місця (T-4725b): PATCH
// збирається в `patches`, GET віддає задану пару й довідники.

export const LOCATION_A = '018f2b9c-1111-7aaa-8bbb-000000000001';
export const LOCATION_B = '018f2b9c-1111-7aaa-8bbb-000000000002';
export const CLOSED = '018f2b9c-1111-7aaa-8bbb-00000000000f';
export const BARBER_A = '018f2b9c-2222-7aaa-8bbb-000000000001';
export const BARBER_GONE = '018f2b9c-2222-7aaa-8bbb-00000000000f';

export interface Reply {
  choice: { locationId: string | null; barberId: string | null };
  options: { locations: { id: string; name: string }[]; barbers: { id: string; name: string }[] };
}

export const locations = [
  { id: LOCATION_A, name: 'Поділ' },
  { id: LOCATION_B, name: 'Печерськ' },
];
export const barbers = [{ id: BARBER_A, name: 'Ігор' }];

export const EMPTY_REPLY: Reply = {
  choice: { locationId: null, barberId: null },
  options: { locations, barbers },
};

export function mockApi(initial: Reply) {
  const patches: unknown[] = [];
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      patches.push(JSON.parse(String(init.body)));
      return { ok: true, json: async () => initial } as unknown as Response;
    }
    if (url.includes('locationId=')) {
      return {
        ok: true,
        json: async () => ({ options: { locations, barbers } }),
      } as unknown as Response;
    }
    return { ok: true, json: async () => initial } as unknown as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return { patches };
}

export const locationSelect = () => screen.getByLabelText('Звична локація');
export const barberSelect = () => screen.getByLabelText('Звичний барбер');
export const saveButton = () => screen.getByRole('button', { name: 'Зберегти звичне місце' });
/** Довідник завантажився: до цього селекти ще не мають варіантів. */
export const loaded = () => screen.findByRole('option', { name: 'Поділ' });
