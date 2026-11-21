import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomePrestigeConciergeClubPromo } from '../HomePrestigeConciergeClubPromo';

describe('HomePrestigeConciergeClubPromo', () => {
  it('renders correctly with title and action buttons', () => {
    render(<HomePrestigeConciergeClubPromo />);

    expect(
      screen.getByText(/The Executive Prestige Concierge & Priority Access/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Fade Prestige Club/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request Access/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Explore Tiers/i })).toHaveAttribute(
      'href',
      '/services'
    );
  });
});
