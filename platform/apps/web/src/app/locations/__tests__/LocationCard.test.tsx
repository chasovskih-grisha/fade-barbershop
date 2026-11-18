import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { LocationCard } from '../LocationCard';
import type { Location } from '@/lib/api/locations';

// T-4822: картка списку показує студію. Фото — перше за sortOrder, із
// підписом як доступною назвою; порожня галерея — токен-поверхня без
// зламаного зображення й без стокового плейсхолдера.

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

const base: Location = {
  id: 'loc-1',
  code: 'BAUMANA',
  name: 'Fade на Баумана',
  address: 'вул. Баумана, 1',
  lat: 50.44,
  lng: 30.49,
  phone: '+380501234567',
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

describe('LocationCard (T-4822)', () => {
  it('shows the lowest sortOrder photo as the cover with its caption as alt', () => {
    const withPhotos: Location = {
      ...base,
      photos: [
        { url: 'https://media.test/second.jpg', caption: 'Друге', sortOrder: 2 },
        { url: 'https://media.test/first.jpg', caption: 'Зал', sortOrder: 1 },
      ],
    };
    render(<LocationCard location={withPhotos} />);
    expect(screen.getByAltText('Зал').getAttribute('src')).toBe('https://media.test/first.jpg');
  });

  it('falls back to the location name as alt when the cover has no caption', () => {
    const withPhoto: Location = {
      ...base,
      photos: [{ url: 'https://media.test/only.jpg', caption: null, sortOrder: 0 }],
    };
    render(<LocationCard location={withPhoto} />);
    expect(screen.getByAltText('Фото локації Fade на Баумана')).toBeTruthy();
  });

  it('renders no image for an empty gallery and keeps the logo mark', () => {
    render(<LocationCard location={base} />);
    expect(screen.queryByRole('img', { name: /Фото локації/ })).toBeNull();
    expect(screen.getByAltText('Логотип Fade на Баумана')).toBeTruthy();
  });

  it('links to booking and to the location detail page', () => {
    render(<LocationCard location={base} />);
    expect(screen.getByRole('link', { name: 'Деталі' }).getAttribute('href')).toBe(
      '/locations/BAUMANA'
    );
    expect(screen.getByRole('link', { name: 'Записатися' }).getAttribute('href')).toBe('/booking');
  });
});
