import { ServiceRegistry } from './service-registry';

describe('ServiceRegistry (T-5003)', () => {
  const registry = new ServiceRegistry([
    {
      name: 'BookingService',
      methods: [
        {
          name: 'GetBooking',
          requestFields: ['bookingId'],
          responseFields: ['id', 'status'],
        },
      ],
    },
  ]);

  it('finds internal methods and lists registered services', () => {
    expect(registry.find('BookingService', 'GetBooking')?.responseFields).toEqual(['id', 'status']);
    expect(registry.find('BookingService', 'Missing')).toBeUndefined();
    expect(registry.list()).toHaveLength(1);
  });

  it('validates request payload fields', () => {
    expect(registry.validateRequest('BookingService', 'GetBooking', { bookingId: 'b1' })).toEqual([]);
    expect(registry.validateRequest('BookingService', 'GetBooking', {})).toEqual([
      'missing_field:bookingId',
    ]);
    expect(
      registry.validateRequest('BookingService', 'GetBooking', { bookingId: 'b1', extra: 1 })
    ).toEqual(['unknown_field:extra']);
    expect(registry.validateRequest('Nope', 'GetBooking', {})).toEqual([
      'unknown_method:Nope.GetBooking',
    ]);
  });
});
