import { BOOKING_SCHEMA, GraphqlContract } from './graphql-contract';
import { ServiceRegistry } from './service-registry';
import type { Selection } from './gateway.types';

const contract = new GraphqlContract();

describe('GraphqlContract validation (T-5003)', () => {
  it('accepts nested selections and exposes the booking schema', () => {
    expect(BOOKING_SCHEMA.types.map((type) => type.name)).toEqual([
      'Booking',
      'Client',
      'Barber',
      'Payment',
    ]);
    expect(
      contract.validate('Booking', [
        { field: 'id' },
        { field: 'client', children: [{ field: 'firstName' }] },
      ])
    ).toEqual([]);
  });

  it('rejects unknown fields, leaf selections and excessive depth', () => {
    expect(contract.validate('Booking', [{ field: 'secret' }])).toEqual([
      { path: 'Booking.secret', message: 'unknown_field' },
    ]);
    expect(
      contract.validate('Booking', [{ field: 'id', children: [{ field: 'x' }] }])
    ).toEqual([{ path: 'Booking.id', message: 'leaf_cannot_have_selection' }]);
    expect(contract.validate('Nope', [{ field: 'id' }])).toEqual([
      { path: 'Nope', message: 'unknown_type:Nope' },
    ]);

    const recursive = new GraphqlContract({
      types: [
        {
          name: 'Node',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'child', type: 'object', of: 'Node' },
          ],
        },
      ],
    });
    let selection: Selection[] = [{ field: 'id' }];
    for (let depth = 0; depth < 6; depth += 1) {
      selection = [{ field: 'child', children: selection }];
    }
    expect(recursive.validate('Node', selection)[0]?.message).toBe('selection_too_deep');
  });
});

describe('GraphqlContract projection (T-5003)', () => {
  it('projects only requested fields, including nested objects and arrays', () => {
    const payload = {
      id: 'booking-1',
      status: 'confirmed',
      priceMinor: 45_000,
      secret: 'internal',
      client: { id: 'client-1', firstName: 'Ada', phone: '+380501112233' },
      barber: [{ id: 'b1', displayName: 'Ivan', tier: 'senior' }],
      payment: null,
    };

    expect(
      contract.project('Booking', payload, [
        { field: 'id' },
        { field: 'priceMinor' },
        { field: 'client', children: [{ field: 'firstName' }] },
        { field: 'barber', children: [{ field: 'displayName' }] },
        { field: 'payment', children: [{ field: 'status' }] },
      ])
    ).toEqual({
      id: 'booking-1',
      priceMinor: 45_000,
      client: { firstName: 'Ada' },
      barber: [{ displayName: 'Ivan' }],
      payment: null,
    });
  });
});

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
