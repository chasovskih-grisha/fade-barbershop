import { render, screen } from '@testing-library/react';
import { HomePreparingHero } from '../HomePreparingHero';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// T-4614e: до відкриття першої студії на головній немає ні CTA запису, ні ціни —
// лише обіцянка відкриття і шлях до локацій/послуг.

describe('HomePreparingHero', () => {
  it('обіцяє відкриття замість запису', () => {
    render(<HomePreparingHero />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/скоро відкриється/i);
    expect(screen.queryByRole('link', { name: /Записатися/ })).toBeNull();
  });

  it('не називає ціну до відкриття', () => {
    render(<HomePreparingHero />);
    expect(screen.queryByText(/₴/)).toBeNull();
  });

  it('веде до локацій і послуг', () => {
    render(<HomePreparingHero />);
    expect(screen.getByRole('link', { name: 'Де ми відкриємось' }).getAttribute('href')).toBe(
      '/locations'
    );
    expect(screen.getByRole('link', { name: 'Послуги та прайс' }).getAttribute('href')).toBe(
      '/services'
    );
  });
});
