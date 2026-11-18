import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeAuraGlowPromo } from '../HomeAuraGlowPromo';

describe('HomeAuraGlowPromo', () => {
  it('renders promotional title and action links correctly', () => {
    render(<HomeAuraGlowPromo />);
    
    expect(screen.getByText(/Комплексний догляд «Aura Glow»/i)).toBeInTheDocument();
    expect(screen.getByText(/Записатися на Aura Glow/i)).toBeInTheDocument();
    expect(screen.getByText(/Усі послуги/i)).toBeInTheDocument();
    expect(screen.getByText(/Гарантія форми 21 день/i)).toBeInTheDocument();
  });
});
