// T-4429: банер «застарілі дані» показується лише при офлайні.
import React from 'react';
import { render, within } from '@testing-library/react-native';
import { IndexHome } from './index-home';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('IndexHome — offline-банер (T-4429)', () => {
  it('показує банер і дані, коли кеш застарілий', () => {
    const { getByTestId, getByText } = render(
      <IndexHome loading={false} stale locations={[]} services={[]} />
    );

    expect(getByTestId('offline-banner')).toBeTruthy();
    expect(getByText(/Офлайн/)).toBeTruthy();
  });

  it('без банера, коли дані свіжі', () => {
    const { queryByTestId } = render(
      <IndexHome loading={false} stale={false} locations={[]} services={[]} />
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
      <IndexHome loading={false} stale={false} locations={[]} services={[]} />
    );

    expect(queryByText(/Теплій/)).toBeNull();
    expect(queryByText(/₴/)).toBeNull();
  });

  it('з двома локаціями hero не називає жодну адресу', () => {
    const { getByTestId, queryByText } = render(
      <IndexHome
        loading={false}
        stale={false}
        locations={[
          location('a', 'Студія A', 'Тепла, 5'),
          location('b', 'Студія B', 'Хрещатик, 1'),
        ]}
        services={[]}
      />
    );

    const hero = getByTestId('home-hero');
    expect(within(hero).getByText(/FADE/)).toBeTruthy();
    expect(within(hero).queryByText(/Тепла/)).toBeNull();
    expect(within(hero).queryByText(/Хрещатик/)).toBeNull();
    expect(queryByText(/Тепла, 5/)).toBeTruthy(); // адреса лишається в картці
  });

  it('порожній список не вигадує студію, але лишає назву мережі', () => {
    const { getByTestId } = render(
      <IndexHome loading={false} stale={false} locations={[]} services={[]} />
    );

    expect(within(getByTestId('home-hero')).getByText(/Мережа чоловічих перукарень/)).toBeTruthy();
  });
});
