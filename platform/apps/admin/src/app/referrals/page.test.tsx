import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReferralsPage from './page';

describe('ReferralsPage (RFR-ADM-01..03)', () => {
  it('renders referral settings and referral list with anti-abuse filters', () => {
    render(<ReferralsPage />);

    expect(screen.getByText(/Реферальна програма та анти-аб'юз/i)).toBeInTheDocument();
    expect(screen.getByText(/Налаштування програми \(RFR-ADM-01\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Artem Kravchenko/i)).toBeInTheDocument();
    expect(screen.getByText(/Спільний телефон/i)).toBeInTheDocument();
  });

  it('allows filtering by suspicious patterns', () => {
    render(<ReferralsPage />);

    const suspiciousBtn = screen.getByText(/⚠️ Підозрілі/i);
    fireEvent.click(suspiciousBtn);

    expect(screen.getByText(/Artem Kravchenko/i)).toBeInTheDocument();
    expect(screen.queryByText(/Denys Melnyk/i)).not.toBeInTheDocument();
  });

  it('requires reason when revoking a referral', () => {
    render(<ReferralsPage />);

    const revokeButtons = screen.getAllByRole('button', { name: /Анулювати/i });
    fireEvent.click(revokeButtons[0]!);

    const confirmBtn = screen.getByRole('button', { name: /Підтвердити анулювання/i });
    fireEvent.click(confirmBtn);

    expect(screen.getByText(/Причина анулювання/i)).toBeInTheDocument();
  });
});
