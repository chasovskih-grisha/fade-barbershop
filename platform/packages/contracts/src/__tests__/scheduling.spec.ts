import {
  type DurationVariantSelection,
  type ServiceDurationVariant,
  type ServiceWithDurationVariants,
  BARBER_UNAVAILABLE_CANCEL_REASON,
  isBarberUnavailableReason,
} from '../scheduling';

describe('причина скасування «барбер недоступний» (T-4616b)', () => {
  it('бачить канонічне значення і код рішення як один факт', () => {
    expect(isBarberUnavailableReason(BARBER_UNAVAILABLE_CANCEL_REASON)).toBe(true);
    expect(isBarberUnavailableReason('BARBER_UNAVAILABLE')).toBe(true);
    expect(isBarberUnavailableReason('  Barber Unavailable ')).toBe(true);
  });

  it('не вважає недоступністю інші причини й порожнє значення', () => {
    for (const reason of [
      null,
      undefined,
      '',
      'client cancelled',
      'no-show',
      'barberunavailable',
    ]) {
      expect(isBarberUnavailableReason(reason)).toBe(false);
    }
  });

  it('експортує тип варіанта тривалості та вибір у запиті (T-4419)', () => {
    const variant: ServiceDurationVariant = {
      label: 'long',
      duration: 60,
      parallelDuration: 50,
      priceDelta: 150,
      description: null,
    };
    const service: ServiceWithDurationVariants = { variants: [variant] };
    const selection: DurationVariantSelection = { variantLabel: variant.label };
    expect(service.variants?.[0]?.duration).toBe(60);
    expect(selection.variantLabel).toBe('long');
  });
});
