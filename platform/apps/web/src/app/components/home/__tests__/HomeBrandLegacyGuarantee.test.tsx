import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeBrandLegacyGuarantee } from '../HomeBrandLegacyGuarantee';

describe('HomeBrandLegacyGuarantee', () => {
  it('renders brand impact guarantee title and CTA buttons', () => {
    render(<HomeBrandLegacyGuarantee />);
    expect(screen.getByText(/FADE Brand Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Безкомпромісна точність/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Записатися на стрижку/i })).toBeInTheDocument();
  });
});
