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

  it('lets a lone card take the whole row and leaves a full row alone', () => {
    const { unmount } = render(
      <CardGrid data-testid="solo">
        <Card data-testid="only-card">Only child</Card>
      </CardGrid>
    );
    const solo = screen.getByTestId('solo');
    const lone = screen.getByTestId('only-card');
    expect(lone.matches(':only-child')).toBe(true);
    expect(solo.className).toContain('[&>*:only-child]:col-span-full');
    expect(solo.className).toContain('[&>*:only-child]:max-w-md');
    expect(solo.className).toContain('[&>*:only-child]:mx-auto');
    expect(solo.className).toContain('[&>*:only-child]:w-full');
    unmount();

    render(
      <CardGrid data-testid="row">
        <Card data-testid="card-a">A</Card>
        <Card data-testid="card-b">B</Card>
        <Card data-testid="card-c">C</Card>
      </CardGrid>
    );
    const row = screen.getByTestId('row');
    expect(row.children).toHaveLength(3);
    expect(Array.from(row.children).some((child) => child.matches(':only-child'))).toBe(false);
    expect(row.className).toContain('sm:grid-cols-2');
    expect(row.className).toContain('lg:grid-cols-3');
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
