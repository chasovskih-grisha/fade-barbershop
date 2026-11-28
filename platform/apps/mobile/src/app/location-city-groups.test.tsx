// T-4821b: список локацій у застосунку групується за `addressParts.city`;
// локації без міста — хвіст без вигаданого підпису.
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { LocationCityGroups, groupByCity, locationHref } from './location-city-groups';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const location = (code: string, city: string | null) => ({
  id: code,
  code,
  name: `Студія ${code}`,
  address: 'вул. Тепла, 1',
  addressParts: city ? { street: 'Тепла', building: '1', city } : null,
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

describe('groupByCity (T-4821b)', () => {
  it('тримає порядок появи міста і ставить локації без міста в хвіст', () => {
    const groups = groupByCity([
      location('a', 'Київ'),
      location('b', 'Львів'),
      location('c', null),
      location('d', 'Київ'),
    ]);

    expect(groups.map((group) => group.city)).toEqual(['Київ', 'Львів', null]);
    expect(groups.map((group) => group.locations.map((loc) => loc.code))).toEqual([
      ['a', 'd'],
      ['b'],
      ['c'],
    ]);
  });
});

describe('LocationCityGroups (T-4821b)', () => {
  it('малює заголовок міста над його студіями', () => {
    const { getByText, getByTestId } = render(
      <LocationCityGroups locations={[location('a', 'Київ'), location('b', 'Львів')]} />
    );

    expect(getByTestId('city-group-Київ')).toBeTruthy();
    expect(getByText('Київ')).toBeTruthy();
    expect(getByTestId('city-group-Львів')).toBeTruthy();
  });

  it('не підставляє «Київ» локації без міста', () => {
    const { getByTestId, queryByText } = render(
      <LocationCityGroups locations={[location('c', null)]} />
    );

    expect(getByTestId('city-group-unknown')).toBeTruthy();
    expect(queryByText('Київ')).toBeNull();
  });

  it('відкриває студію за кодом при натисканні (T-4843)', () => {
    const { getByTestId } = render(<LocationCityGroups locations={[location('LVI-01', 'Львів')]} />);
    fireEvent.press(getByTestId('location-card-LVI-01'));
    expect(mockPush).toHaveBeenCalledWith(locationHref('LVI-01'));
  });
});
