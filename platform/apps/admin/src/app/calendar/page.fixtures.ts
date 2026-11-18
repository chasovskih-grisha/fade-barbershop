// Фікстури fetch-роутера для спеки CalendarPage — окремий файл (гейт max-lines, ADR 0019).
// Один відповідає на всі адмін-запити сторінки календаря; невідомі маршрути → 404.

export const VISITS = {
  from: '2026-09-28T00:00:00.000Z',
  visits: [
    {
      id: 'apt-1',
      bookingId: 'b-1',
      appointmentId: 'apt-1',
      locationId: 'loc-1',
      barberId: 'barber-1',
      start: '2026-09-28T10:00:00.000Z',
      end: '2026-09-28T11:00:00.000Z',
      status: 'booked',
      serviceId: null,
      agreedPrice: 600,
      partyId: null,
      partyRole: null,
      haircutReferenceId: 'ref-1',
      referencePhotoUrl: 'https://signed.test/ref-1.jpg?ttl=900',
      comment: null,
      source: 'web',
      clientId: null,
    },
  ],
};

export const route = (url: string) => {
  if (url.startsWith('/admin/auth/me'))
    return { ok: true, json: async () => ({ id: 'admin-1', role: 'admin' }) };
  if (url.startsWith('/admin/locations'))
    return { ok: true, json: async () => [{ id: 'loc-1', name: 'Сіті Лейк' }] };
  if (url.startsWith('/admin/barbers'))
    return { ok: true, json: async () => [{ id: 'barber-1', name: 'Іван' }] };
  if (url.startsWith('/admin/calendar')) return { ok: true, json: async () => VISITS };
  // prettier-ignore
  if (url.includes('/admin/appointments/apt-1/confirm')) return { ok: true, json: async () => ({ status: 'confirmed' }) };
  return { ok: false, json: async () => ({}) };
};
