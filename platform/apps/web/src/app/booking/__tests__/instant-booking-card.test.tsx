import { fireEvent, render, screen } from '@testing-library/react';
import InstantBookingCard from '../steps/InstantBookingCard';

describe('instant booking card (T-5027)', () => {
  it('shows the nearest window and books it in one tap', () => {
    const onBook = jest.fn();
    const slot = { start: '11:00', end: '12:00', barbers: ['barber-1'] };

    render(<InstantBookingCard slot={slot} onBook={onBook} />);

    expect(screen.getByTestId('instant-booking')).toBeInTheDocument();
    expect(screen.getByText('11:00–12:00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Записатися зараз' }));
    expect(onBook).toHaveBeenCalledWith(slot);
  });
});
