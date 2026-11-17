// Юніт-тести редукції рядків Prisma у факти зведення (T-4606b) — без БД:
// ключ бронювання (`ClientProfile.id` АБО `User.id`), сума візитів по локаціях,
// вибір останнього візиту і його локації, порожній профіль і `revenue: null`.
import { reduceProfiles } from './client-list-facts.reduce';

const T = (iso: string) => new Date(iso);

const row = (over: Partial<Parameters<typeof reduceProfiles>[0][number]> = {}) => ({
  id: 'p-1',
  userId: 'u-1',
  createdAt: T('2026-01-01T00:00:00.000Z'),
  loyaltyVisitsCount: 0,
  ...over,
});

describe('reduceProfiles (T-4606b)', () => {
  it('профіль без візитів — нулі й null, не помилка', () => {
    expect(reduceProfiles([row()], [])).toEqual([
      {
        createdAt: T('2026-01-01T00:00:00.000Z'),
        loyaltyVisits: 0,
        visits: 0,
        lastVisitAt: null,
        lastVisitLocation: null,
      },
    ]);
  });

  it('візити під `id` профілю: сума по локаціях і останній візит із його локацією', () => {
    const facts = reduceProfiles(
      [row({ loyaltyVisitsCount: 2 })],
      [
        {
          clientId: 'p-1',
          locationId: 'loc-1',
          count: 2,
          lastStart: T('2026-09-20T10:00:00.000Z'),
        },
        {
          clientId: 'p-1',
          locationId: 'loc-2',
          count: 1,
          lastStart: T('2026-10-01T12:00:00.000Z'),
        },
      ]
    );
    expect(facts[0]).toMatchObject({
      loyaltyVisits: 2,
      visits: 3,
      lastVisitAt: T('2026-10-01T12:00:00.000Z'),
      lastVisitLocation: 'loc-2',
    });
  });

  it('візити лише під `userId` — фолбек на нього (шлях запису через User.id)', () => {
    const facts = reduceProfiles(
      [row()],
      [{ clientId: 'u-1', locationId: 'loc-3', count: 4, lastStart: T('2026-10-05T09:00:00.000Z') }]
    );
    expect(facts[0]).toMatchObject({ visits: 4, lastVisitLocation: 'loc-3' });
  });

  it('візити під обома ключами — читається `id` (те саме правило, що в рядку таблиці)', () => {
    const facts = reduceProfiles(
      [row()],
      [
        {
          clientId: 'p-1',
          locationId: 'loc-1',
          count: 1,
          lastStart: T('2026-10-01T10:00:00.000Z'),
        },
        {
          clientId: 'u-1',
          locationId: 'loc-2',
          count: 5,
          lastStart: T('2026-10-09T10:00:00.000Z'),
        },
      ]
    );
    expect(facts[0]).toMatchObject({ visits: 1, lastVisitLocation: 'loc-1' });
  });

  it('`lastStart: null` враховує візит у лічильнику, але не робить його останнім', () => {
    const facts = reduceProfiles(
      [row()],
      [
        { clientId: 'p-1', locationId: 'loc-1', count: 2, lastStart: null },
        {
          clientId: 'p-1',
          locationId: 'loc-2',
          count: 1,
          lastStart: T('2026-09-01T10:00:00.000Z'),
        },
      ]
    );
    expect(facts[0]).toMatchObject({ visits: 3, lastVisitLocation: 'loc-2' });
  });
});
