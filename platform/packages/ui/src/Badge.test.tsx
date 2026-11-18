import { render, screen } from '@testing-library/react';
import { Badge, type BadgeTone } from './Badge';

describe('Badge', () => {
  it('рендерить вміст', () => {
    render(<Badge>AI</Badge>);
    expect(screen.getByText('AI')).toBeTruthy();
  });

  it('застосовує тон за замовчуванням', () => {
    render(<Badge>Нове</Badge>);
    expect(screen.getByText('Нове').className).toContain('text-fg-secondary');
  });

  it('підтримує доступність (aria-label та role)', () => {
    render(<Badge aria-label="VIP статус" role="status">VIP</Badge>);
    const badge = screen.getByText('VIP');
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-label')).toBe('VIP статус');
  });

  it('застосовує клас кожного тону', () => {
    const expected: Record<BadgeTone, string> = {
      neutral: 'border-line',
      accent: 'text-accent-blue',
      success: 'text-semantic-success',
      warning: 'text-semantic-warning',
      danger: 'text-semantic-danger',
      info: 'text-semantic-info',
    };
    for (const [tone, className] of Object.entries(expected)) {
      const { unmount } = render(<Badge tone={tone as BadgeTone}>x</Badge>);
      expect(screen.getByText('x').className).toContain(className);
      unmount();
    }
  });
});
