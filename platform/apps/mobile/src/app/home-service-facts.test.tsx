// T-4849: головна не показує одну ціну як ціну всіх студій. Ціна належить
// студії (ADR 0006); тут лишаються назва послуги і тривалість, а ₴ немає.
import React from 'react';
import { render } from '@testing-library/react-native';
import { IndexHome } from './index-home';
import { homeServiceFact } from './home-service-facts';
import type { StartupSection } from '../lib/use-startup-data';
import type { LocationDto } from '../lib/api/locations';
import type { ServiceDto } from '../lib/api/catalog';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const ready = <T,>(data: T): StartupSection<T> => ({ data, status: 'ready', stale: false });

const location = (code: string, name: string, address: string): LocationDto => ({
  id: code,
  code,
  name,
  address,
  addressParts: null,
  lat: 0,
  lng: 0,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
});

const service = (
  fields: Pick<ServiceDto, 'id' | 'name' | 'price' | 'durationMinutes'>
): ServiceDto => ({ ...fields, active: true });

const locations = [location('podil', 'Поділ', 'Нижній Вал 12'), location('center', 'Центр', 'Хрещатик 3')];
const services = [
  service({ id: 's1', name: 'Стрижка', price: 450, durationMinutes: 45 }),
  service({ id: 's2', name: 'Гоління', price: 300, durationMinutes: 30 }),
];

describe('Головна — ціна належить студії (T-4849)', () => {
  it('рядок послуги несе назву і тривалість, без грошей', () => {
    expect(homeServiceFact(services[0] as ServiceDto)).toEqual({
      id: 's1',
      title: 'Стрижка',
      duration: '45 хв',
    });
  });

  it('з двома студіями блок послуг не малює жодного ₴', () => {
    const { queryByText, getByText } = render(
      <IndexHome stale={false} locations={ready(locations)} services={ready(services)} />
    );

    expect(getByText('Стрижка')).toBeTruthy();
    expect(getByText('45 хв')).toBeTruthy();
    expect(getByText('Гоління')).toBeTruthy();
    expect(getByText('30 хв')).toBeTruthy();
    expect(queryByText(/₴/)).toBeNull();
    expect(queryByText('450')).toBeNull();
    expect(queryByText('300')).toBeNull();
  });
});
