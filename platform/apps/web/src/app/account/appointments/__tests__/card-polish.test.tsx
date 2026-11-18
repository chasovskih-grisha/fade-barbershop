import { render, screen } from '@testing-library/react';
import { AppointmentCard } from '../AppointmentCard';
import type { ExtendedAppointment } from '@/lib/api/appointments';

describe('AppointmentCard Polish (ACC-01)', () => {
  const mockApp: ExtendedAppointment = {
    id: 'app-1',
    date: '10 листопада',
    startTime: '14:00',
    endTime: '15:00',
    serviceName: 'Мужська стрижка',
    barberName: 'Олександр',
    locationName: 'Центр (вул. Велика Васильківська)',
    status: 'confirmed',
    price: 850,
    referenceId: null,
    referenceComment: '',
    canEditReference: true,
  };

  it('renders refined card details and price correctly', () => {
    render(
      <AppointmentCard
        app={mockApp}
        processingAction={null}
        onReschedule={() => {}}
        onCancel={() => {}}
        onEditReference={() => {}}
      />
    );

    expect(screen.getByText('10 листопада о 14:00')).toBeInTheDocument();
    expect(screen.getByText(/Центр/)).toBeInTheDocument();
    expect(screen.getByText('Мужська стрижка • Олександр')).toBeInTheDocument();
    expect(screen.getByText('850 ₴')).toBeInTheDocument();
    expect(screen.getByText('Підтверджено')).toBeInTheDocument();
  });
});
