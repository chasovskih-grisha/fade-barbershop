import { render, screen } from '@testing-library/react';
import tokens from '@fade/design-tokens/tokens.json';
import { Icon } from './Icon';
import { iconPaths } from './icons';

describe('Icon', () => {
  it('малює іконку на сітці 24px зі stroke із токенів', () => {
    const { container } = render(<Icon name="menu" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe(
      `0 0 ${tokens.icons.grid.value} ${tokens.icons.grid.value}`
    );
    expect(svg?.getAttribute('stroke-width')).toBe(String(tokens.icons.stroke.min));
    expect(svg?.getAttribute('fill')).toBe('none');
  });

  it('декоративна іконка прихована від допоміжних технологій', () => {
    const { container } = render(<Icon name="check" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('з label іконка доступна як зображення з назвою', () => {
    render(<Icon name="phone" label="Телефон локації" />);
    expect(screen.getByRole('img', { name: 'Телефон локації' })).toBeTruthy();
  });

  it('розмір береться зі шкали токенів', () => {
    const { container } = render(<Icon name="user" size={16} />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-4 w-4');
  });

  it('кожна іконка набору — контурна (без заливки)', () => {
    for (const [name, node] of Object.entries(iconPaths)) {
      const { container, unmount } = render(<Icon name={name as keyof typeof iconPaths} />);
      expect(container.querySelector('svg')?.getAttribute('fill')).toBe('none');
      expect(node).toBeTruthy();
      unmount();
    }
  });
});
