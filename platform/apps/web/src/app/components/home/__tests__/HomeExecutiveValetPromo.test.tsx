import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeExecutiveValetPromo } from '../HomeExecutiveValetPromo';

describe('HomeExecutiveValetPromo', () => {
  it('renders badge, title, description and action links', () => {
    render(<HomeExecutiveValetPromo />);

    expect(screen.getByText(/Executive Valet/i)).toBeInTheDocument();
    expect(screen.getByText(/Преміальний супровід та паркінг біля крісла/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Записатися з комфортом/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Усі послуги/i })).toHaveAttribute('href', '/services');
  });
});
