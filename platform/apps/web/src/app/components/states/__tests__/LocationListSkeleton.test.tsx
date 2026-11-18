import { render, screen } from '@testing-library/react';
import { LocationListSkeleton } from '../LocationListSkeleton';

// T-4825: скелет списку локацій має форму завантаженої сторінки — сітку карток,
// а не вузьку текстову колонку. Інакше прихід даних «стрибає» (CLS).

describe('LocationListSkeleton (T-4825)', () => {
  it('renders a card grid, not a single text column', () => {
    render(<LocationListSkeleton />);

    const grid = screen.getByTestId('locations-skeleton');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('md:grid-cols-2');
  });

  it('shows at least two card placeholders by default', () => {
    render(<LocationListSkeleton />);
    expect(screen.getAllByTestId('locations-skeleton-card').length).toBeGreaterThanOrEqual(2);
  });

  it('honours an explicit placeholder count', () => {
    render(<LocationListSkeleton items={6} />);
    expect(screen.getAllByTestId('locations-skeleton-card')).toHaveLength(6);
  });
});
