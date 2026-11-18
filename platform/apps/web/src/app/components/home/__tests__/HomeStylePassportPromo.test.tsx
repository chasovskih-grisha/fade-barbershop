import { render, screen } from '@testing-library/react';
import { HomeStylePassportPromo } from '../HomeStylePassportPromo';

describe('HomeStylePassportPromo', () => {
  it('renders passport promo titles and action links correctly', () => {
    render(<HomeStylePassportPromo />);
    expect(screen.getAllByText(/Style Passport/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Абонемент «Style Passport»/i)).toBeInTheDocument();
    expect(screen.getByText(/Оформити Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/Переглянути послуги/i)).toBeInTheDocument();
  });
});
