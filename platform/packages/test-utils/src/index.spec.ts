// Юніт-спеки @fade/test-utils: валідність/унікальність phone, дефолти й
// override сіду локації, walkInWindow. Retry-хелпери — у http-retry.spec.ts.
import { testPhone } from './seed-phone';
import { seedTestLocation } from './seed-location';
import { walkInWindow } from './seed-booking';

describe('testPhone', () => {
  it('генерує валідний +380-номер рівно з 9 цифр після коду', () => {
    expect(testPhone()).toMatch(/^\+380\d{9}$/);
  });

  it('унікальний у межах гарантії генератора (10 викликів в одному мс)', () => {
    // Стеля гарантії — 10/мс (лічильник-цифра; uuid-цифра далі лише ймовірнісна).
    // Реальні сюїти сіють одиниці барберів — далеко під стелею.
    const seen = new Set(Array.from({ length: 10 }, () => testPhone()));
    expect(seen.size).toBe(10);
  });
});

describe('seedTestLocation', () => {
  let captured: Record<string, unknown>;
  const prisma = {
    location: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        captured = data;
      }),
    },
  };

  beforeEach(() => {
    captured = {};
  });

  it('дефолти: 1 крісло, години 08–18 усі 7 днів, код з префіксом E2E', async () => {
    await seedTestLocation(prisma as never, {});
    const data = captured as unknown as {
      code: string;
      chairs: { create: unknown[] };
      hours: { create: unknown[] };
    };
    expect(data.code).toMatch(/^E2E-[0-9A-F]{8}$/);
    expect(data.chairs.create).toHaveLength(1);
    expect(data.hours.create).toHaveLength(7);
  });

  it('override: id, chairs: 2, active: false, середа closed', async () => {
    // prettier-ignore
    const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, open: '09:00', close: '20:00', closed: dayOfWeek === 2 }));
    await seedTestLocation(prisma as never, { id: 'fixed-id', chairs: 2, active: false, hours });
    expect(captured.id).toBe('fixed-id');
    expect((captured as unknown as { chairs: { create: unknown[] } }).chairs.create).toHaveLength(
      2
    );
    expect((captured as unknown as { active: boolean }).active).toBe(false);
    // prettier-ignore
    expect((captured as unknown as { hours: { create: { closed: boolean }[] } }).hours.create.filter((h) => h.closed)).toHaveLength(1);
  });
});

describe('walkInWindow', () => {
  it('повний день на задану дату', () => {
    const w = walkInWindow('2026-11-09');
    expect(w.start.toISOString()).toBe('2026-11-09T00:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-11-09T23:59:59.000Z');
  });
});
