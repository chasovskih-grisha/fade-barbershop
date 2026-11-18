import { render, screen } from '@testing-library/react';
import { HomeHero } from '../HomeHero';

describe('HomeHero', () => {
  it('renders hero titles and action buttons correctly', () => {
    render(<HomeHero />);
    expect(screen.getByText(/Точність форми/i)).toBeInTheDocument();
    expect(screen.getByText(/Записатися онлайн/i)).toBeInTheDocument();
    expect(screen.getByText(/Послуги та прайс/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2 крісла/i).length).toBeGreaterThan(0);
  });
});
