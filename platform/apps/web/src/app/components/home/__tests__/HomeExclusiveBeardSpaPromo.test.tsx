import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeExclusiveBeardSpaPromo } from '../HomeExclusiveBeardSpaPromo';

describe('HomeExclusiveBeardSpaPromo', () => {
  it('renders promo heading and actions', () => {
    render(<HomeExclusiveBeardSpaPromo />);
    expect(screen.getByText(/Ексклюзивний спа-ритуал для бороди/i)).toBeInTheDocument();
    expect(screen.getByText(/Записатися на Спа/i)).toBeInTheDocument();
    expect(screen.getByText(/Озонові гарячі компреси/i)).toBeInTheDocument();
  });
});
