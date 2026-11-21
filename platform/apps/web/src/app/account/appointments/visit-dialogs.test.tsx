import { fireEvent, render, screen } from '@testing-library/react';
import { AppointmentModals } from './AppointmentModals';
import type { ExtendedAppointment } from '@/lib/api/appointments';

const visit: ExtendedAppointment = {
  id: 'apt-1',
  date: '2026-10-02',
  startTime: '11:00',
  endTime: '11:45',
  serviceName: 'Стрижка',
  barberName: 'Олексій',
  locationName: 'Поділ',
  price: 600,
  status: 'upcoming',
  referenceId: null,
  referenceComment: '',
  canEditReference: false,
  canBookAgain: true,
};

function renderDialog(dialog: 'cancel' | 'reschedule', onReschedule = jest.fn()) {
  const onCancel = jest.fn();
  render(
    <AppointmentModals
      selected={visit}
      dialog={dialog}
      busy={false}
      actionError={null}
      onClose={jest.fn()}
      onCancel={onCancel}
      onReschedule={onReschedule}
      onReference={jest.fn()}
    />
  );
  return { onCancel, onReschedule };
}

describe('діалоги візиту', () => {
  it('підтвердження скасування викликає onCancel', () => {
    const { onCancel } = renderDialog('cancel');
    fireEvent.click(screen.getByRole('button', { name: 'Скасувати запис' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('перенесення надсилає дату і кінець тієї ж тривалості', () => {
    const onReschedule = jest.fn();
    renderDialog('reschedule', onReschedule);
    fireEvent.change(screen.getByLabelText('Дата'), { target: { value: '2026-10-03' } });
    fireEvent.change(screen.getByLabelText('Початок'), { target: { value: '14:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Перенести' }));
    expect(onReschedule).toHaveBeenCalledWith({ date: '2026-10-03', start: '11:00', end: '11:45' });
  });

  it('діалог скасування не обіцяє повернення депозиту — платежного контуру ще немає', () => {
    renderDialog('cancel');
    expect(screen.queryByText('Політика депозиту')).toBeNull();
  });
});
