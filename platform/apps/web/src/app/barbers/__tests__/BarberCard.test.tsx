import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { BarberCard } from '../BarberCard';

// T-4851a: картка майстра не вигадує факти. Два різні записи дають різні
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

  it('claims no free window, no rank and no brand subtitle', () => {
    const { container } = render(<BarberCard {...base} role="Барбер" experience="3 роки" />);
    expect(container.textContent).not.toContain('Вільні вікна сьогодні');
    expect(container.textContent).not.toContain('Експерт Fade');
    expect(container.textContent).not.toContain('Fade Atelier');
    expect(container.textContent).toContain('Барбер • 3 роки');
    expect(screen.getByRole('link').getAttribute('href')).toBe('/barbers/alex');
  });
});
