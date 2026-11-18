import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeMembershipVIP } from '../HomeMembershipVIP';

describe('HomeMembershipVIP', () => {
  it('renders heading and CTA links correctly', () => {
    render(<HomeMembershipVIP />);
    expect(
      screen.getByText(/Безлімітні стрижки та пріоритетний запис 24\/7 для членів клубу/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Оформити VIP-статус/i })).toHaveAttribute(
      'href',
      '/account'
    );
  });
});
