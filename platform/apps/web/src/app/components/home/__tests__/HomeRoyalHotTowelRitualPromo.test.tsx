import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeRoyalHotTowelRitualPromo } from '../HomeRoyalHotTowelRitualPromo';

describe('HomeRoyalHotTowelRitualPromo', () => {
  it('renders title, description and links', () => {
    render(<HomeRoyalHotTowelRitualPromo />);

    expect(screen.getByText(/The Royal Hot Towel/i)).toBeInTheDocument();
    expect(screen.getByText(/Elevate your grooming session/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book Ritual/i })).toHaveAttribute('href', '/booking');
  });
});
