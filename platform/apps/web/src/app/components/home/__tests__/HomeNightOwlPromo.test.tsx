import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeNightOwlPromo } from '../HomeNightOwlPromo';

describe('HomeNightOwlPromo', () => {
  it('renders title, description and booking link', () => {
    render(<HomeNightOwlPromo />);

    expect(screen.getByText(/Пізні візити/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Індивідуальний підхід для вашого щільного графіка/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Забронювати вечірній час/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Адреси студій/i })).toHaveAttribute(
      'href',
      '/locations'
    );
  });
});
