import {
  renderAppointmentRescheduleSubject,
  renderAppointmentRescheduleText,
  renderAppointmentRescheduleHtml,
} from './appointment-reschedule-template';

describe('AppointmentRescheduleTemplate', () => {
  const sampleData = {
    clientName: 'Олександр',
    locationName: 'FADE Central',
    locationAddress: 'вул. Хрещатик, 1',
    barberName: 'Максим',
    serviceName: 'Чоловіча стрижка',
    oldStart: '2026-11-15T10:00:00.000Z',
    newStart: '2026-11-16T12:00:00.000Z',
    manageUrl: 'https://fade.barbershop/book/123',
    brand: 'FADE',
  };

  it('renders subject correctly', () => {
    const subject = renderAppointmentRescheduleSubject(sampleData);
    expect(subject).toContain('FADE:');
    expect(subject).toContain('змінено');
  });

  it('renders text representation correctly', () => {
    const text = renderAppointmentRescheduleText(sampleData);
    expect(text).toContain('Олександр');
    expect(text).toContain('Максим');
    expect(text).toContain('Чоловіча стрижка');
    expect(text).toContain('https://fade.barbershop/book/123');
  });

  it('renders HTML representation using layout primitives', () => {
    const html = renderAppointmentRescheduleHtml(sampleData);
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Олександр');
    expect(html).toContain('Максим');
    expect(html).toContain('Чоловіча стрижка');
    expect(html).toContain('https://fade.barbershop/book/123');
    expect(html).toContain('FADE Central');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData = {
      newStart: '2026-11-16T12:00:00.000Z',
    };
    expect(renderAppointmentRescheduleSubject(minimalData)).toBeTruthy();
    expect(renderAppointmentRescheduleText(minimalData)).toBeTruthy();
    expect(renderAppointmentRescheduleHtml(minimalData)).toBeTruthy();
  });
});
