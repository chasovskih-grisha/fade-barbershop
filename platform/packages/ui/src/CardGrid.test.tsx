import { render, screen } from '@testing-library/react';
import { CardGrid } from './CardGrid';
import { Card } from './Card';

describe('CardGrid', () => {
  it('renders zero children without error', () => {
    const { container } = render(<CardGrid />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders grid container classes and children', () => {
    render(
      <CardGrid data-testid="grid">
        <Card data-testid="card">Only child</Card>
      </CardGrid>
    );
    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders multiple children in grid', () => {
    render(
      <CardGrid data-testid="grid">
        <Card data-testid="card-1">Child 1</Card>
        <Card data-testid="card-2">Child 2</Card>
      </CardGrid>
    );
    expect(screen.getByTestId('card-1')).toBeTruthy();
    expect(screen.getByTestId('card-2')).toBeTruthy();
  });
});
