// T-4429: банер «застарілі дані» показується лише при офлайні.
import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import { IndexHome } from './index-home';
import type { StartupSection } from '../lib/use-startup-data';

const ready = <T,>(data: T): StartupSection<T> => ({ data, status: 'ready', stale: false });

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('IndexHome — offline-банер (T-4429)', () => {
  it('показує банер і дані, коли кеш застарілий', () => {
    const { getByTestId, getByText } = render(
      <IndexHome stale locations={ready([])} services={ready([])} />
    );

    expect(getByTestId('offline-banner')).toBeTruthy();
    expect(getByText(/Офлайн/)).toBeTruthy();
  });

  it('без банера, коли дані свіжі', () => {
    const { queryByTestId } = render(
      <IndexHome stale={false} locations={ready([])} services={ready([])} />
    );

    expect(queryByTestId('offline-banner')).toBeNull();
  });
});

// T-4845: головний екран не називає одну вулицю і одну ціну.
const location = (code: string, name: string, address: string) => ({
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

describe('IndexHome — hero без однієї студії (T-4845)', () => {
  it('не називає вулицю і не обіцяє ціну', () => {
    const { queryByText } = render(
      <IndexHome stale={false} locations={ready([])} services={ready([])} />
    );

    expect(queryByText(/Теплій/)).toBeNull();
    expect(queryByText(/₴/)).toBeNull();
  });

  it('з двома локаціями hero не називає жодну адресу', () => {
    const { getByTestId, queryByText } = render(
      <IndexHome
        stale={false}
        locations={ready([
          location('a', 'Студія A', 'Тепла, 5'),
          location('b', 'Студія B', 'Хрещатик, 1'),
        ])}
        services={ready([])}
      />
    );

    const hero = getByTestId('home-hero');
    expect(within(hero).getByText(/FADE/)).toBeTruthy();
    expect(within(hero).queryByText(/Тепла/)).toBeNull();
    expect(within(hero).queryByText(/Хрещатик/)).toBeNull();
    expect(queryByText(/Тепла, 5/)).toBeTruthy(); // адреса лишається в картці
  });

  it('показує відмову в сповіщеннях і кнопку повторної спроби (T-070)', () => {
    const onEnablePush = jest.fn();
    const { getByTestId, getByText } = render(
      <IndexHome
        stale={false}
        locations={ready([])}
        services={ready([])}
        pushError="Сповіщення вимкнено на цьому пристрої"
        onEnablePush={onEnablePush}
      />
    );

    expect(getByTestId('push-permission-notice')).toBeTruthy();
    expect(getByText('Сповіщення вимкнено на цьому пристрої')).toBeTruthy();
    fireEvent.press(getByText('Увімкнути сповіщення'));
    expect(onEnablePush).toHaveBeenCalledTimes(1);
  });

  it('мовчить про сповіщення, коли дозвіл надано', () => {
    const { queryByTestId } = render(
      <IndexHome stale={false} locations={ready([])} services={ready([])} pushError={null} />
    );

    expect(queryByTestId('push-permission-notice')).toBeNull();
  });

  it('порожній список не вигадує студію, але лишає назву мережі', () => {
    const { getByTestId } = render(
      <IndexHome stale={false} locations={ready([])} services={ready([])} />
    );

    expect(within(getByTestId('home-hero')).getByText(/Мережа чоловічих перукарень/)).toBeTruthy();
  });
});
