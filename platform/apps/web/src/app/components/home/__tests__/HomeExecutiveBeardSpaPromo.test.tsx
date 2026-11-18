import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeExecutiveBeardSpaPromo } from '../HomeExecutiveBeardSpaPromo';

describe('HomeExecutiveBeardSpaPromo', () => {
  it('renders title, description and links', () => {
    render(<HomeExecutiveBeardSpaPromo />);

    expect(screen.getByText(/Преміум-догляд/i)).toBeInTheDocument();
    expect(screen.getByText(/Відновлюючий спа-догляд за бородою та шкірою обличчя/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Замовити спа-догляд/i })).toHaveAttribute('href', '/booking');
    expect(screen.getByRole('link', { name: /Дізнатися більше/i })).toHaveAttribute('href', '/services');
  });
});
