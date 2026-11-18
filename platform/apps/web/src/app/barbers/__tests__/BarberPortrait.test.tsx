import { createElement as mockCreateElement } from 'react';
import { render, screen } from '@testing-library/react';
import { BarberPortrait } from '../BarberPortrait';
import { BarberCard } from '../BarberCard';

// T-4871a: один портрет 4/5 для картки й профілю. Фото видно повністю — без
// вуалі й без збільшення на hover; без фото лишаються ініціали й пропорція.

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
    mockCreateElement('img', {
      alt: String(props.alt),
      src: String(props.src),
      className: String(props.className ?? ''),
    }),
}));

describe('BarberPortrait (T-4871a)', () => {
  it('renders the photo fully visible without a veil or hover scale', () => {
    const { container } = render(
      <BarberPortrait name="Олександр" photoUrl="https://media.test/alex.jpg" />
    );
    const img = screen.getByAltText('Олександр');
    expect(img.getAttribute('src')).toBe('https://media.test/alex.jpg');
    expect(img.className).not.toContain('scale');
    expect(container.innerHTML).not.toContain('gradient');
    expect(container.innerHTML).not.toContain('opacity-90');
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.className).toContain('aspect-[4/5]');
  });

  it('keeps the 4/5 frame and the initials when the record has no photo', () => {
    const { container } = render(<BarberPortrait name="Максим" />);
    expect(screen.queryByRole('img', { name: 'Максим' })).toBeNull();
    expect(screen.getByRole('img', { name: 'Портрет Максим' }).textContent).toBe('М');
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.className).toContain('aspect-[4/5]');
  });

  it('is the same portrait the listing card uses', () => {
    render(
      <BarberCard id="barber-1" slug="alex" name="Олександр" photoUrl="https://media.test/a.jpg" />
    );
    const img = screen.getByAltText('Олександр');
    expect(img.getAttribute('src')).toBe('https://media.test/a.jpg');
    expect(img.className).toContain('object-cover');
    expect(img.className).not.toContain('scale');
  });
});
