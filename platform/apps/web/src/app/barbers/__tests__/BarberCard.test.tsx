import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { BarberCard } from '../BarberCard';

// T-4851a: картка майстра не вигудує факти. Два різні записи дають різні
// чипи, а запис без спеціалізацій і досвіду — лише ім'я.

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

jest.mock(
  '@fade/ui',
  () => ({
    __esModule: true,
    Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
      mockCreateElement('div', { className }, children),
  }),
  { virtual: true }
);

const base = { id: 'barber-1', slug: 'alex', name: 'Олександр' };

describe('BarberCard — факти запису (T-4851a)', () => {
  it('renders different chips for barbers with different specialties', () => {
    const { container: fade } = render(
      <BarberCard {...base} specialties={['Fade', 'Борода']} experience="7 років" />
    );
    const fadeText = fade.textContent;
    expect(screen.getByText('Fade')).toBeInTheDocument();
    expect(screen.getByText('Борода')).toBeInTheDocument();

    const { container: classic } = render(
      <BarberCard id="barber-2" slug="maksym" name="Максим" specialties={['Класика']} />
    );
    expect(screen.getByText('Класика')).toBeInTheDocument();
    expect(classic.textContent).not.toBe(fadeText);
  });

  it('renders only the name when the record has no specialties and no experience', () => {
    const { container } = render(<BarberCard {...base} />);
    expect(screen.getByRole('heading', { name: 'Олександр' })).toBeInTheDocument();
    expect(container.textContent).not.toContain('Класичні стрижки');
    expect(container.textContent).not.toContain('Моделювання бороди');
    expect(container.textContent).not.toContain('Експертний фейд');
    expect(container.textContent).not.toContain('6+ років досвіду');
    expect(container.textContent).not.toContain('Майстер-барбер');
  });

  it('names the whole card after the person (T-4870a)', () => {
    render(<BarberCard {...base} role="Барбер" experience="3 роки" />);
    expect(screen.getByRole('link', { name: 'Олександр' })).toHaveAttribute(
      'href',
      '/barbers/alex'
    );
  });

  it('claims no free window, no rank and no brand subtitle', () => {
    const { container } = render(<BarberCard {...base} role="Барбер" experience="3 роки" />);
    expect(container.textContent).not.toContain('Вільні вікна сьогодні');
    expect(container.textContent).not.toContain('Експерт Fade');
    expect(container.textContent).not.toContain('Fade Atelier');
    expect(container.textContent).toContain('Барбер • 3 роки');
    expect(screen.getByRole('link').getAttribute('href')).toBe('/barbers/alex');
  });

  it('names one destination in the footer: the profile (T-4859)', () => {
    const { container } = render(<BarberCard {...base} role="Барбер" experience="3 роки" />);

    expect(container.textContent).not.toContain('Вільні вікна');
    expect(container.textContent).not.toContain('Портфоліо майстра');
    expect(container.textContent).not.toContain('Вибрати майстра');
    expect(container.textContent).toContain('Профіль майстра');

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/barbers/alex');
    expect(links[0]).toHaveAttribute('aria-label', 'Олександр');
  });

  it('shows one chip per distinct specialty and trims padding (T-4851)', () => {
    render(<BarberCard {...base} specialties={['Fade', ' Fade ', 'Борода']} />);

    expect(screen.getAllByText('Fade')).toHaveLength(1);
    expect(screen.getByText('Борода')).toBeInTheDocument();
    expect(screen.queryByText(' Fade ')).toBeNull();
  });
});
