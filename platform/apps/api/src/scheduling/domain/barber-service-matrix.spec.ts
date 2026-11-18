// Матриця «барбер × послуга» (T-4521): спільне правило фільтрації барберів за
// послугою локації. Порожня матриця (дефолт «все») → фолбек на всіх барберів.
import { barbersForService, type BarberServiceMatrix } from './barber-service-matrix';

const matrix = (...entries: Array<[string, string[]]>): BarberServiceMatrix =>
  new Map(
    entries.map(([barberId, serviceIds]) => [barberId, new Map([['loc-1', new Set(serviceIds)]])])
  );

describe('barbersForService (T-4521)', () => {
  it('повертає лише барберів, призначених на послугу', () => {
    const m = matrix(['b1', ['service-1']], ['b2', ['service-2']]);

    const allowed = barbersForService(m, { locationId: 'loc-1', serviceId: 'service-1' }, []);

    expect([...allowed]).toEqual(['b1']);
  });

  it('порожня матриця → фолбек на всіх активних барберів локації', () => {
    const allowed = barbersForService(new Map(), { locationId: 'loc-1', serviceId: 's' }, [
      'b1',
      'b2',
    ]);

    expect([...allowed].sort()).toEqual(['b1', 'b2']);
  });

  it('жоден призначений не виконує послугу → фолбек (дефолт «все»)', () => {
    const m = matrix(['b1', ['service-2']]);

    const allowed = barbersForService(m, { locationId: 'loc-1', serviceId: 'service-1' }, [
      'b1',
      'b2',
    ]);

    expect([...allowed].sort()).toEqual(['b1', 'b2']);
  });

  it('барбер виконує підмножину послуг локації: поза нею його немає у фільтрі', () => {
    const m = matrix(['b1', ['service-1']], ['b2', ['service-1', 'service-2']]);

    const allowed = barbersForService(m, { locationId: 'loc-1', serviceId: 'service-2' }, []);

    expect([...allowed]).toEqual(['b2']);
  });

  it('не змішує локації: призначення іншої локації не діє', () => {
    const other = new Map([['b1', new Map([['loc-9', new Set(['service-1'])]])]]);

    const allowed = barbersForService(other, { locationId: 'loc-1', serviceId: 'service-1' }, [
      'b2',
    ]);

    expect([...allowed]).toEqual(['b2']);
  });
});
