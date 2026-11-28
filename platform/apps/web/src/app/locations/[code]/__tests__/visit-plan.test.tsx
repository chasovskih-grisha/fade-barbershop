import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { LocationDetail } from '../LocationDetail';
import type { Location } from '@/lib/api/locations';

// T-4831: сторінка студії — план візиту. Порядок регіонів перевіряється на
// справжньому компоненті сторінки, а не на окремих блоках.

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

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

const photo = (sortOrder: number, caption: string | null) => ({
  url: `https://cdn.example.com/${sortOrder}.jpg`,
  caption,
  sortOrder,
});

const base: Location = {
  id: 'loc-1',
  code: 'KYY-01',
  name: 'FADE Сіті Лейк',
  address: 'пров. Ювілейний 2/1',
  addressParts: { street: 'Ювілейний', building: '2/1', city: 'Київ' },
  lat: 50.45,
  lng: 30.52,
  phone: '+380441234567',
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [{ channel: 'instagram', value: 'fade.city', sortOrder: 0 }],
  photos: [photo(1, 'Друге фото'), photo(0, 'Перше фото')],
  logo: null,
};

const sections = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-section]')).map((node) =>
    node.getAttribute('data-section')
  );

describe('LocationDetail — план візиту (T-4831)', () => {
  it('тримає порядок герой → дії → години → контакти → як дійти → галерея', () => {
    const { container } = render(<LocationDetail location={base} />);

    expect(sections(container)).toEqual([
      'hero',
      'actions',
      'hours',
      'contacts',
      'directions',
      'gallery',
    ]);
    expect(container.firstElementChild?.className).toContain('max-w-container');
  });

  it('бере в герой перше за sortOrder фото, а не перше у відповіді', () => {
    render(<LocationDetail location={base} />);

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'https://cdn.example.com/0.jpg');
  });

  it('без фото не малює плейсхолдера й не резервує порожню галерею', () => {
    const { container } = render(<LocationDetail location={{ ...base, photos: [] }} />);

    expect(sections(container)).toEqual(['hero', 'actions', 'hours', 'contacts', 'directions']);
    expect(screen.queryByTestId('location-hero-photo')).toBeNull();
  });

  it('кнопка запису липка до широкого брейкпойнта, далі — у потоці', () => {
    const { container } = render(<LocationDetail location={base} />);
    const actions = container.querySelector('[data-section="actions"]');

    expect(actions?.className).toContain('sticky');
    expect(actions?.className).toContain('md:static');
  });
});
