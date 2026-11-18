import { render, screen } from '@testing-library/react';
import { HomeObsidianCrownGroomingPromo } from '../HomeObsidianCrownGroomingPromo';

describe('HomeObsidianCrownGroomingPromo', () => {
  it('renders promo titles and action buttons correctly', () => {
    render(<HomeObsidianCrownGroomingPromo />);
    expect(screen.getAllByText(/Obsidian Crown/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Забронювати Obsidian Crown/i)).toBeInTheDocument();
    expect(screen.getByText(/Усі послуги/i)).toBeInTheDocument();
    expect(screen.getByText(/Індивідуальний консьєрж-сервіс/i)).toBeInTheDocument();
  });
});
