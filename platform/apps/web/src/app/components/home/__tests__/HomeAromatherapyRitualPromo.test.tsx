import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeAromatherapyRitualPromo } from '../HomeAromatherapyRitualPromo';

describe('HomeAromatherapyRitualPromo', () => {
  it('renders title, description and links', () => {
    render(<HomeAromatherapyRitualPromo />);

    expect(
      screen.getByText(/Елітний ароматерапевтичний ритуал гарячого рушника та ефірних олій/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Записатися на ритуал/i })).toHaveAttribute(
      'href',
      '/booking'
    );
    expect(screen.getByRole('link', { name: /Усі послуги/i })).toHaveAttribute('href', '/services');
  });
});
