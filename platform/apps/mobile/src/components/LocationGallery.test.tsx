import React from 'react';
import { BackHandler } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LocationScreen from '../app/(client)/locations/[code]/page';
import * as locationsApi from '../lib/api/locations';
import type { LocationDto, LocationPhotoDto } from '../lib/api/locations';

// T-4834b: фото показуються в sortOrder, тап відкриває перегляд із повним
// підписом і лічильником, гортання йде по колу, закриття лишає на екрані
// студії, а системна кнопка «назад» закриває саме перегляд.

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({ code: 'clt-01' }),
}));
jest.mock('../lib/api/locations');

const photo = (sortOrder: number, caption: string | null): LocationPhotoDto => ({
  url: `https://cdn.example.com/${sortOrder}.jpg`,
  caption,
  sortOrder,
});

const location = (photos: LocationPhotoDto[]): LocationDto => ({
  id: '1',
  code: 'clt-01',
  name: 'FADE Central',
  address: 'Тепла, 5',
  addressParts: null,
  lat: 50.45,
  lng: 30.5,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos,
  logo: null,
});

const photos = [photo(1, 'Друге фото'), photo(0, 'Перше фото — довгий підпис краєвиду студії')];

describe('Галерея студії в застосунку (T-4834b)', () => {
  it('без фото секції немає', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([location([])]);
    render(<LocationScreen />);
    await screen.findByTestId('studio-name');
    expect(screen.queryByTestId('studio-gallery')).toBeNull();
  });

  it('показує кадри в sortOrder і відкриває повний підпис', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([location(photos)]);
    render(<LocationScreen />);

    await screen.findByTestId('studio-gallery');
    const thumbs = screen.getAllByTestId(/^studio-gallery-thumb-/);
    expect(thumbs.map((node) => node.props.testID)).toEqual([
      'studio-gallery-thumb-0',
      'studio-gallery-thumb-1',
    ]);

    fireEvent.press(screen.getByTestId('studio-gallery-thumb-0'));

    expect(screen.getByTestId('studio-gallery-counter').props.children.join('')).toBe('1 / 2');
    expect(String(screen.getByTestId('studio-gallery-caption').props.children)).toBe(
      'Перше фото — довгий підпис краєвиду студії'
    );
  });

  it('гортає по колу і закривається кнопкою', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([location(photos)]);
    render(<LocationScreen />);
    fireEvent.press(await screen.findByTestId('studio-gallery-thumb-1'));

    fireEvent.press(screen.getByTestId('studio-gallery-next'));
    expect(screen.getByTestId('studio-gallery-counter').props.children.join('')).toBe('1 / 2');

    fireEvent.press(screen.getByTestId('studio-gallery-prev'));
    expect(screen.getByTestId('studio-gallery-counter').props.children.join('')).toBe('2 / 2');

    fireEvent.press(screen.getByTestId('studio-gallery-close'));
    expect(screen.queryByTestId('studio-gallery-viewer')).toBeNull();
    expect(screen.getByTestId('studio-name')).toBeTruthy();
  });

  it('системна кнопка «назад» закриває перегляд, а не екран студії', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([location(photos)]);
    const addEventListener = jest.spyOn(BackHandler, 'addEventListener');
    render(<LocationScreen />);
    fireEvent.press(await screen.findByTestId('studio-gallery-thumb-0'));

    const handler = addEventListener.mock.calls.at(-1)?.[1];
    const handled = handler?.() ?? false;

    expect(handled).toBe(true);
    expect(screen.queryByTestId('studio-gallery-viewer')).toBeNull();
    expect(screen.getByTestId('studio-name')).toBeTruthy();
    addEventListener.mockRestore();
  });

  it('збій завантаження кадру лишає підпис, а не порожню рамку', async () => {
    jest.spyOn(locationsApi, 'fetchLocations').mockResolvedValue([location(photos)]);
    render(<LocationScreen />);
    fireEvent.press(await screen.findByTestId('studio-gallery-thumb-0'));

    const image = screen.getByTestId('studio-gallery-photo');
    fireEvent(image, 'error');

    await waitFor(() =>
      expect(
        String(screen.getByTestId('studio-gallery-viewer-fallback').props.children)
      ).toContain('Перше фото — довгий підпис краєвиду студії')
    );
  });
});
