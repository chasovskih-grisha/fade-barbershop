import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeVIPReferralAcceleratorPromo } from '../HomeVIPReferralAcceleratorPromo';

describe('HomeVIPReferralAcceleratorPromo', () => {
  it('renders correctly with title and action buttons', () => {
    render(<HomeVIPReferralAcceleratorPromo />);

    expect(screen.getByText(/Подвійний привілей FADE/i)).toBeInTheDocument();
    expect(screen.getByText(/VIP-членство -20%/i)).toBeInTheDocument();
    expect(screen.getByText(/300 ₴ за друга/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Активувати VIP-статус/i })).toHaveAttribute(
      'href',
      '/account'
    );
    expect(screen.getByRole('link', { name: /Запросити друга/i })).toHaveAttribute(
      'href',
      '/account/referrals'
    );
  });
});
