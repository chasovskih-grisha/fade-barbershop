import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarberVacationPlanner, { VacationRequestItem } from './BarberVacationPlanner';

describe('BarberVacationPlanner', () => {
  const mockRequests: VacationRequestItem[] = [
    { id: 'v-1', startDate: '2026-12-01', endDate: '2026-12-10', reason: 'Щорічна відпустка', status: 'pending' },
  ];

  it('renders planner and allows requesting vacation', async () => {
    const handleRequest = jest.fn().mockResolvedValue(true);
    const handleAction = jest.fn().mockResolvedValue(true);

    render(
      <BarberVacationPlanner
        barberId="b-1"
        barberName="Alex Fade"
        requests={mockRequests}
        onRequestVacation={handleRequest}
        onApproveRejectRequest={handleAction}
      />
    );

    expect(screen.getByText(/Планувальник відпусток та лікарняних: Alex Fade/i)).toBeInTheDocument();
    expect(screen.getByText(/Щорічна відпустка/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Дата початку відпустки'), { target: { value: '2026-12-15' } });
    fireEvent.change(screen.getByLabelText('Дата закінчення відпустки'), { target: { value: '2026-12-20' } });
    fireEvent.change(screen.getByLabelText('Причина відпустки'), { target: { value: 'Особисті справи' } });

    fireEvent.click(screen.getByRole('button', { name: 'Подати заявку' }));

    await waitFor(() => {
      expect(handleRequest).toHaveBeenCalledWith('2026-12-15', '2026-12-20', 'Особисті справи');
      expect(screen.getByText(/Заявку на відпустку успішно створено та надіслано на затвердження/i)).toBeInTheDocument();
    });
  });

  it('allows approving pending vacation request and locks slots', async () => {
    const handleRequest = jest.fn().mockResolvedValue(true);
    const handleAction = jest.fn().mockResolvedValue(true);

    render(
      <BarberVacationPlanner
        barberId="b-1"
        barberName="Alex Fade"
        requests={mockRequests}
        onRequestVacation={handleRequest}
        onApproveRejectRequest={handleAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Схвалити' }));

    await waitFor(() => {
      expect(handleAction).toHaveBeenCalledWith('v-1', 'approved');
      expect(screen.getByText(/Заявку схвалено, слоти заблоковано автоматично/i)).toBeInTheDocument();
    });
  });
});
