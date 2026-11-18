import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeRoyalEssenceVaultPromo } from '../HomeRoyalEssenceVaultPromo';

describe('HomeRoyalEssenceVaultPromo', () => {
  it('renders royal essence vault promo title and action links correctly', () => {
    render(<HomeRoyalEssenceVaultPromo />);

    expect(screen.getAllByText(/Royal Essence Vault/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/рідкісні парфумовані олії/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Забронювати з Vault/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Дізнатися більше/i })).toHaveAttribute(
      'href',
      '/services'
    );
  });
});
