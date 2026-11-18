import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('рендерить вміст', () => {
    render(<Card>Вміст</Card>);
    expect(screen.getByText('Вміст')).toBeTruthy();
  });

  it('має стан interactive з hover-класами та аспект-атрибутами доступності', () => {
    render(<Card interactive data-testid="interactive-card">Клік</Card>);
    const card = screen.getByTestId('interactive-card');
    expect(card.className).toContain('hover:border-line-strong');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabIndex')).toBe('0');
  });

  it('підтримує варіанти відступів (padding)', () => {
    const { rerender } = render(<Card data-testid="card" padding="sm">sm</Card>);
    expect(screen.getByTestId('card').className).toContain('p-3');

    rerender(<Card data-testid="card" padding="lg">lg</Card>);
    expect(screen.getByTestId('card').className).toContain('p-6');

    rerender(<Card data-testid="card" padding="none">none</Card>);
    expect(screen.getByTestId('card').className).toContain('p-0');
  });

  it('прокидає className і data-атрибути', () => {
    render(
      <Card className="w-full" data-testid="card">
        x
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card.className).toContain('w-full');
  });
});
