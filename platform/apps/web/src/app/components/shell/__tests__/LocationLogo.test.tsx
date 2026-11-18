import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { LocationLogo } from '../LocationLogo';

// Знак локації (T-4609): фолбек на нічний мережевий знак, `alt` з моделі,
// порожній `alt` замінюється назвою, темна тема бере `darkUrl`.

jest.mock('next/image', () => ({
  __esModule: true,
  // Тестовий стенд: createElement обходить JSX-правило без директив.
  default: (props: Record<string, unknown>) =>
    mockCreateElement('img', { alt: String(props.alt), src: String(props.src) }),
}));

describe('LocationLogo', () => {
  it('без логотипа показує нічний мережевий знак з alt за назвою', () => {
    render(<LocationLogo logo={null} name="Fade на Баумана" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('alt')).toBe('Логотип Fade на Баумана');
    expect(img.getAttribute('src')).toBe('test-file-stub');
  });

  it('з логотипом бере alt і світлий URL з моделі', () => {
    render(
      <LocationLogo
        logo={{
          variant: 'lockup',
          lightUrl: 'https://media.test/light.svg',
          darkUrl: null,
          alt: 'FADE Podil',
        }}
        name="Fade Podil"
      />
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('alt')).toBe('FADE Podil');
    expect(img.getAttribute('src')).toBe('https://media.test/light.svg');
  });

  it('порожній alt не лишає скринрідер без опису', () => {
    render(
      <LocationLogo
        logo={{
          variant: 'mark',
          lightUrl: 'https://media.test/light.svg',
          darkUrl: null,
          alt: '   ',
        }}
        name="Fade Lviv"
      />
    );
    expect(screen.getByRole('img').getAttribute('alt')).toBe('Логотип Fade Lviv');
  });

  it('темна тема бере darkUrl окремим джерелом', () => {
    const { container } = render(
      <LocationLogo
        logo={{
          variant: 'lockup',
          lightUrl: 'https://media.test/light.svg',
          darkUrl: 'https://media.test/dark.svg',
          alt: 'FADE Obolon',
        }}
        name="Fade Obolon"
      />
    );
    const source = container.querySelector('source');
    expect(source?.getAttribute('srcset')).toBe('https://media.test/dark.svg');
    expect(source?.getAttribute('media')).toContain('prefers-color-scheme: dark');
  });
});
