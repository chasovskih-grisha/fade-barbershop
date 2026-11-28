import { createElement as mockCreateElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { LocationCityGroups } from '../LocationCityGroups';
import type { Location } from '@/lib/api/locations';

// T-4823: гость, якому потрібна адреса й фото, не проходить крізь кнопку, що
// виглядає як початок запису. Картка — одне посилання на студію з назвою як
// доступною назвою; «Записатися» — окремий контрол зі своїм href; список — `ul`.

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

const studio = (over: Partial<Location> = {}): Location => ({
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
  ...over,
});

describe('LocationCard — картка веде в студію, запис окремо (T-4823)', () => {
  it('картка має одне посилання на студію, назване назвою студії', () => {
    render(<LocationCityGroups locations={[studio()]} />);

    const cardLink = screen.getByRole('link', { name: 'Fade на Баумана' });
    expect(cardLink.getAttribute('href')).toBe('/locations/BAUMANA');
  });

  it('«Записатися» веде в /booking і не є посиланням на студію', () => {
    render(<LocationCityGroups locations={[studio()]} />);

    const book = screen.getByRole('link', { name: 'Записатися' });
    expect(book.getAttribute('href')).toBe('/booking');
    expect(book.getAttribute('href')).not.toBe('/locations/BAUMANA');
    expect(within(book).queryByRole('heading')).toBeNull();

    const studioLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/locations/BAUMANA');
    expect(studioLinks).toHaveLength(1);
  });

  it('не пропонує другої кнопки «Деталі» й не називає список стрічкою', () => {
    const { container } = render(<LocationCityGroups locations={[studio()]} />);

    expect(screen.queryByRole('link', { name: 'Деталі' })).toBeNull();
    expect(container.querySelector('[role="feed"]')).toBeNull();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });
});
