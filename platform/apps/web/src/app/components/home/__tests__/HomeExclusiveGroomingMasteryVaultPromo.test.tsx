import { render, screen } from '@testing-library/react';
import { HomeExclusiveGroomingMasteryVaultPromo } from '../HomeExclusiveGroomingMasteryVaultPromo';

describe('HomeExclusiveGroomingMasteryVaultPromo', () => {
  it('renders correctly with title and CTA', () => {
    render(<HomeExclusiveGroomingMasteryVaultPromo />);
    expect(screen.getByText(/Vault of Grooming Mastery/i)).toBeInTheDocument();
    expect(screen.getByText(/Argan & Cedar Elixir/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /забронювати сеанс/i })).toBeInTheDocument();
  });
});
