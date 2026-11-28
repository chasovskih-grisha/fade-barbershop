// T-4616b: клієнт бачить, що барбер недоступний, і може записатися знову;
// без причини з сервера картка не вигадує її.
import { render, screen } from '@testing-library/react';
import { BARBER_UNAVAILABLE_CANCEL_REASON } from '@fade/contracts';
import { AppointmentCard } from '../AppointmentCard';
import type { ExtendedAppointment } from '@/lib/api/appointments';

const base: ExtendedAppointment = {
  id: 'app-unavailable',
  date: '27 листопада',
  startTime: '09:00',
  endTime: '10:00',
  serviceName: 'Стрижка',
  barberName: 'Олександр',
  locationName: 'Центр',
  status: 'cancelled',
  price: 700,
  referenceId: null,
  referenceComment: '',
  canEditReference: false,
  canBookAgain: true,
  cancelReason: BARBER_UNAVAILABLE_CANCEL_REASON,
};

function renderCard(app: ExtendedAppointment) {
  return render(
    <AppointmentCard
      app={app}
      processingAction={null}
      onReschedule={() => {}}
      onCancel={() => {}}
      onEditReference={() => {}}
    />
  );
}

describe('AppointmentCard — барбер недоступний (T-4616b)', () => {
  it('пояснює скасування і пропонує новий час', () => {
    renderCard(base);

    expect(screen.getByText(/Барбер недоступний/)).toBeInTheDocument();
    expect(screen.getByText('Записатися знову')).toBeInTheDocument();
  });

  // Settlement повертає кожен списаний платіж, вікно скасування тут не діє:
  // копія не обіцяє «за політикою салону» (T-4616b).
  it('не посилається на політику скасування', () => {
    renderCard(base);

    expect(screen.getByText(/повертаємо повністю/)).toBeInTheDocument();
    expect(screen.queryByText(/за політикою салону/)).not.toBeInTheDocument();
  });

  it('візит у партії не пропонує повторний запис', () => {
    renderCard({ ...base, canBookAgain: false });

    expect(screen.getByText(/Барбер недоступний/)).toBeInTheDocument();
    expect(screen.queryByText('Записатися знову')).not.toBeInTheDocument();
  });

  it('скасування без причини не вигадує недоступність', () => {
    renderCard({ ...base, cancelReason: null });

    expect(screen.queryByText(/Барбер недоступний/)).not.toBeInTheDocument();
  });
});
