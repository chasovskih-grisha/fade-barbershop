import { renderStaffBookingSubject, renderStaffBookingText, renderStaffBookingHtml, staffBookingLines, StaffBookingLetterData } from './staff-booking-template';

describe('StaffBookingTemplate', () => {
  const sampleData: StaffBookingLetterData = {
    locationName: 'FADE Central',
    locationAddress: 'вул. Хрещатик, 1',
    barberName: 'Олександр',
    clientName: 'Іван Петренко',
    clientPhone: '+380501234567',
    serviceName: 'Стрижка бороди та волосся',
    start: '2026-11-15T12:00:00Z',
    dashboardUrl: 'https://fade.barbershop/admin/schedule',
  };

  test('generates expected letter lines', () => {
    const lines = staffBookingLines(sampleData);
    expect(lines).toContainEqual(['Майстер', 'Олександр']);
    expect(lines).toContainEqual(['Клієнт', 'Іван Петренко']);
    expect(lines).toContainEqual(['Телефон клієнта', '+380501234567']);
    expect(lines).toContainEqual(['Послуга', 'Стрижка бороди та волосся']);
  });

  test('renders subject correctly', () => {
    const subject = renderStaffBookingSubject(sampleData, 'FADE');
    expect(subject).toContain('Новий запис');
    expect(subject).toContain('Стрижка бороди та волосся');
    expect(subject).toContain('FADE');
  });

  test('renders text body correctly', () => {
    const text = renderStaffBookingText(sampleData, 'FADE');
    expect(text).toContain('Вітаємо, майстре!');
    expect(text).toContain('Олександр');
    expect(text).toContain('Іван Петренко');
    expect(text).toContain('https://fade.barbershop/admin/schedule');
  });

  test('renders html body correctly with responsive layout', () => {
    const html = renderStaffBookingHtml(sampleData, 'FADE');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Вітаємо, майстре!');
    expect(html).toContain('Іван Петренко');
    expect(html).toContain('https://fade.barbershop/admin/schedule');
  });
});
