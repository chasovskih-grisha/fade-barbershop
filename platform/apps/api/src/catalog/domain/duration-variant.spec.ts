import { InvalidDurationVariantError, assertDurationVariant, resolveDurations, selectDurationVariant, type DurationVariant } from './duration-variant';

const short: DurationVariant = {
  label: 'short',
  duration: 30,
  parallelDuration: 25,
  priceDelta: 0,
  description: 'Тільки машинка',
};
const standard: DurationVariant = {
  label: 'standard',
  duration: 45,
  parallelDuration: null,
  priceDelta: 0,
  description: null,
};
const long: DurationVariant = {
  label: 'long',
  duration: 60,
  parallelDuration: 50,
  priceDelta: 150,
  description: 'Стрижка + борода',
};

describe('T-4419 duration variants', () => {
  it('validates a variant and rejects a blank label', () => {
    expect(assertDurationVariant(long)).toEqual(long);
    expect(() => assertDurationVariant({ ...long, label: '  ' })).toThrow(
      InvalidDurationVariantError
    );
  });

  it('rejects durations outside 5..480 minutes', () => {
    expect(() => assertDurationVariant({ ...long, duration: 4 })).toThrow(
      InvalidDurationVariantError
    );
    expect(() => assertDurationVariant({ ...long, duration: 481 })).toThrow(
      InvalidDurationVariantError
    );
    expect(() => assertDurationVariant({ ...long, duration: 45.5 })).toThrow(
      InvalidDurationVariantError
    );
  });

  it('rejects a non-integer price delta and an invalid parallel duration', () => {
    expect(() => assertDurationVariant({ ...long, priceDelta: 10.5 })).toThrow(
      InvalidDurationVariantError
    );
    expect(() => assertDurationVariant({ ...long, parallelDuration: 2 })).toThrow(
      InvalidDurationVariantError
    );
  });

  it('a service without variants keeps its own duration (backward compatible)', () => {
    expect(resolveDurations({ duration: 40, parallelDuration: 35 })).toEqual({
      duration: 40,
      parallelDuration: 35,
    });
  });

  it('resolves the slot length from the selected variant', () => {
    const service = { duration: 45, parallelDuration: null, variants: [short, standard, long] };
    expect(resolveDurations(service, 'short')).toEqual({ duration: 30, parallelDuration: 25 });
    expect(resolveDurations(service, 'long')).toEqual({ duration: 60, parallelDuration: 50 });
  });

  it('defaults to the standard variant, then the first when there is none', () => {
    expect(selectDurationVariant([short, standard, long])).toEqual(standard);
    expect(selectDurationVariant([short, long])).toEqual(short);
    expect(selectDurationVariant(undefined)).toBeNull();
    expect(selectDurationVariant([])).toBeNull();
  });

  it('rejects an unknown variant label', () => {
    expect(() => selectDurationVariant([short, long], 'extra')).toThrow(
      InvalidDurationVariantError
    );
  });
});
