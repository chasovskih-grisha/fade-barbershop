// Специфікація read-моделі календаря (T-045 §5.1): вікна день/тиждень
// (Monday-first, неділя повертається до понеділка), фільтри REF-ADM-02,
// мепінг рядка Booking у візит сітки й підпис референсів одним викликом порту
// (REF-ADM-01). Prisma — фейк: фіксуємо where.
import type { CalendarQuery } from './admin-calendar';
import { row, setup } from './admin-calendar.fixtures';

const base: CalendarQuery = { date: '2026-11-09' };

describe('AdminCalendar (T-045 §5.1)', () => {
  it('день: вікно [00:00, +1d) і мепінг рядка (fallback id/status)', async () => {
    const { calendar, findMany } = setup([
      row({ appointmentId: 'apt-1', status: 'confirmed' }),
      row(),
    ]);
    const result = await calendar.handle(base);
    expect(result.from).toBe('2026-11-09T00:00:00.000Z');
    expect(result.to).toBe('2026-11-10T00:00:00.000Z');
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ start: 'asc' });
    expect(result.visits[0]).toMatchObject({
      id: 'apt-1',
      status: 'confirmed',
      start: '2026-11-09T10:00:00.000Z',
    });
    expect(result.visits[1]).toMatchObject({ id: 'bk-1', bookingId: 'bk-1', status: 'booked' });
    // Явний view: 'day' — та сама доба.
    const explicit = await calendar.handle({ ...base, view: 'day' });
    expect(explicit.to).toBe('2026-11-10T00:00:00.000Z');
  });

  it('тиждень: будь-який день тижня → понеділок…понеділок; неділя теж назад до понеділка', async () => {
    const { calendar, findMany } = setup();
    const wed = await calendar.handle({ ...base, date: '2026-11-11', view: 'week' });
    expect(wed.from).toBe('2026-11-09T00:00:00.000Z');
    expect(wed.to).toBe('2026-11-16T00:00:00.000Z');
    await calendar.handle({ ...base, date: '2026-11-15', view: 'week' }); // неділя
    expect(findMany.mock.calls[1][0].where.start).toEqual({
      lt: new Date('2026-11-16T00:00:00.000Z'),
    });
  });

  it('фільтри: локація+барбер у where; reference=with/without', async () => {
    const { calendar, findMany } = setup();
    await calendar.handle({ ...base, locationId: 'loc-9', barberId: 'b-9' });
    expect(findMany.mock.calls[0][0].where).toMatchObject({ locationId: 'loc-9', barberId: 'b-9' });
    await calendar.handle({ ...base, reference: 'with' });
    expect(findMany.mock.calls[1][0].where.haircutReferenceId).toEqual({ not: null });
    await calendar.handle({ ...base, reference: 'without' });
    expect(findMany.mock.calls[2][0].where.haircutReferenceId).toBeNull();
    await calendar.handle({ ...base, reference: 'all' });
    expect(findMany.mock.calls[3][0].where.haircutReferenceId).toBeUndefined();
    // reference не передано — дефолт 'all' (гілка ??).
    await calendar.handle({ ...base });
    expect(findMany.mock.calls[4][0].where.haircutReferenceId).toBeUndefined();
  });

  it('фільтр статусу: booked включає рядки без Appointment (status=null), інші — точний збіг', async () => {
    const { calendar, findMany } = setup();
    await calendar.handle({ ...base, status: 'confirmed' });
    expect(findMany.mock.calls[0][0].where.status).toBe('confirmed');
    await calendar.handle({ ...base, status: 'booked' });
    expect(findMany.mock.calls[1][0].where.OR).toEqual([{ status: 'booked' }, { status: null }]);
    // без статусу — умова не додається взагалі.
    await calendar.handle({ ...base });
    expect(findMany.mock.calls[2][0].where).not.toHaveProperty('status');
    expect(findMany.mock.calls[2][0].where).not.toHaveProperty('OR');
  });

  it('невалідний запит: без дати, кривий формат, неможлива дата — InvalidSlotError', async () => {
    const { calendar } = setup();
    await expect(calendar.handle({ ...base, date: '' })).rejects.toThrow('date is required');
    await expect(calendar.handle({ ...base, date: 'не-дата' })).rejects.toThrow('date is required');
    await expect(calendar.handle({ ...base, date: '2026-99-99' })).rejects.toThrow(
      'Invalid calendar date'
    );
  });
});
