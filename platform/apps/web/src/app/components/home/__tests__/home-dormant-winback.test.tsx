import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomeDormantClientWinBackPromo } from '../HomeDormantClientWinBackPromo';

describe('HomeDormantClientWinBackPromo', () => {
  it('renders win-back promotion title, discount info, and action links', () => {
    render(<HomeDormantClientWinBackPromo />);

    expect(screen.getByText(/Персональна реактивація FADE Win-Back/i)).toBeInTheDocument();
    expect(screen.getByText('Давно не бачилися? Отримайте спеціальний бонус повернення до 25%')).toBeInTheDocument();
    expect(screen.getByText(/До 25% знижки/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Активувати Win-Back/i })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: /Записатися зараз/i })).toHaveAttribute('href', '/booking');
  });
});
