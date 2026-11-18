import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeExecutiveAuraElitePromo } from '../HomeExecutiveAuraElitePromo';

describe('HomeExecutiveAuraElitePromo', () => {
  it('renders executive aura elite promo correctly', () => {
    render(<HomeExecutiveAuraElitePromo />);
    expect(screen.getByText(/Executive Aura & Elite Concierge Pass/i)).toBeInTheDocument();
    expect(screen.getByText(/The Ultimate Gentleman Experience & Priority Privilege/i)).toBeInTheDocument();
    expect(screen.getByText(/Claim Elite Pass/i)).toBeInTheDocument();
  });
});
