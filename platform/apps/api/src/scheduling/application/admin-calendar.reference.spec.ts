// REF-ADM-01: сітка календаря віддає підписаний URL референсу разом із візитом,
// щоб картка дня не робила окремий GET /admin/reference-photos/:id на кожен
// візит. Порт підпису — фейк (фікстури в admin-calendar.fixtures.ts).
import type { CalendarQuery } from './admin-calendar';
import { row, setup } from './admin-calendar.fixtures';

const base: CalendarQuery = { date: '2026-11-09' };

describe('AdminCalendar: підписані URL референсів (REF-ADM-01)', () => {
  it('підписує референси всього вікна одним викликом порту', async () => {
    const signed = 'https://signed.test/ref-1.jpg?ttl=900';
    const { calendar, sign } = setup(
      [
        row({ appointmentId: 'apt-1', haircutReferenceId: 'ref-1' }),
        row({ haircutReferenceId: 'ref-2' }),
      ],
      [['ref-1', signed]]
    );

    const result = await calendar.handle(base);

    // Один виклик на сітку, а не на картку; відсутній у мапі ID → null.
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(['ref-1', 'ref-2']);
    expect(result.visits[0]?.referencePhotoUrl).toBe(signed);
    expect(result.visits[1]?.referencePhotoUrl).toBeNull();
  });

  it('сітка без референсів не кличе порт заради нічого', async () => {
    const { calendar, sign } = setup([row(), row()]);

    const result = await calendar.handle(base);

    expect(sign).toHaveBeenCalledWith([]);
    expect(result.visits.map((visit) => visit.referencePhotoUrl)).toEqual([null, null]);
  });
});
