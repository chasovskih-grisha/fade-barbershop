import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeVelvetCrestMasteryPromo } from '../HomeVelvetCrestMasteryPromo';

describe('HomeVelvetCrestMasteryPromo', () => {
  it('renders title and CTA links correctly', () => {
    render(<HomeVelvetCrestMasteryPromo />);

    expect(screen.getByText(/Комплекс «Velvet Crest»/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Записатися на Velvet Crest/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Усі послуги/i })).toHaveAttribute('href', '/services');
  });
});
