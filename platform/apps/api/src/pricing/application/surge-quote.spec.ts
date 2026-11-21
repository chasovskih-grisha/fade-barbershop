// T-4811: surge у ціні слота — множник, надбавка і фіксація правила.
import { NO_SURGE_BP, SurgePricing, type SurgeRuleStore } from './surge-quote';
import type { SurgeRule } from '../domain/surge-rule';

const FRIDAY_EVENING = new Date('2026-11-20T18:30:00Z');

class FakeStore implements SurgeRuleStore {
  readonly asked: string[] = [];
  constructor(private readonly rules: SurgeRule[]) {}
  async activeRules(locationId: string): Promise<SurgeRule[]> {
    this.asked.push(locationId);
    return this.rules;
  }
}

const rule = (patch: Partial<SurgeRule>): SurgeRule => ({
  id: 'surge-1',
  locationId: null,
  dayOfWeek: null,
  fromMinute: null,
  toMinute: null,
  seniorityTier: null,
  multiplierBp: 12_500,
  active: true,
  ...patch,
});

describe('SurgePricing (T-4811)', () => {
  it('без правила ціна не змінюється', async () => {
    const quote = await new SurgePricing(new FakeStore([])).quote({
      locationId: 'loc-1',
      start: FRIDAY_EVENING,
      basePrice: 20_000,
    });
    expect(quote).toEqual({ multiplierBp: NO_SURGE_BP, ruleId: null, amount: 0, price: 20_000 });
  });

  it('застосовує правило мережі й рахує надбавку', async () => {
    const quote = await new SurgePricing(new FakeStore([rule({})])).quote({
      locationId: 'loc-1',
      start: FRIDAY_EVENING,
      basePrice: 20_000,
    });
    expect(quote).toEqual({
      multiplierBp: 12_500,
      ruleId: 'surge-1',
      amount: 5_000,
      price: 25_000,
    });
  });

  it('правило конкретної локації перемагає мережеве', async () => {
    const store = new FakeStore([
      rule({ id: 'network', multiplierBp: 11_000 }),
      rule({ id: 'local', locationId: 'loc-1', multiplierBp: 14_000 }),
    ]);
    const quote = await new SurgePricing(store).quote({
      locationId: 'loc-1',
      start: FRIDAY_EVENING,
      basePrice: 10_000,
    });
    expect(quote.ruleId).toBe('local');
    expect(quote.price).toBe(14_000);
    expect(store.asked).toEqual(['loc-1']);
  });

  it('рівень барбера передається в матчинг', async () => {
    const seniorOnly = rule({ seniorityTier: 'senior' });
    const pricing = new SurgePricing(new FakeStore([seniorOnly]));
    expect(
      (await pricing.quote({ locationId: 'loc-1', start: FRIDAY_EVENING, basePrice: 100 })).ruleId
    ).toBeNull();
    expect(
      (
        await pricing.quote({
          locationId: 'loc-1',
          start: FRIDAY_EVENING,
          basePrice: 100,
          seniorityTier: 'senior',
        })
      ).ruleId
    ).toBe('surge-1');
  });
});
