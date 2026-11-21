import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeFirstVisitPerk } from '../HomeFirstVisitPerk';

describe('HomeFirstVisitPerk', () => {
  it('renders first visit perk title and CTA buttons', () => {
    render(<HomeFirstVisitPerk />);

    expect(screen.getByText(/Привілей першого візиту/i)).toBeInTheDocument();
    expect(screen.getByText(/Перший візит у FADE/i)).toBeInTheDocument();
    expect(screen.getByText(/Записатися з бонусом/i)).toBeInTheDocument();
  });
});
