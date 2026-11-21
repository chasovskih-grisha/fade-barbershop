import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeExpressRefreshPromo } from '../HomeExpressRefreshPromo';

describe('HomeExpressRefreshPromo', () => {
  it('renders express refresh title and CTA buttons', () => {
    render(<HomeExpressRefreshPromo />);

    expect(screen.getByText(/Експрес-догляд/i)).toBeInTheDocument();
    expect(screen.getByText(/Express Refresh між повними візитами/i)).toBeInTheDocument();
    expect(screen.getByText(/Записатися на Express/i)).toBeInTheDocument();
  });
});
