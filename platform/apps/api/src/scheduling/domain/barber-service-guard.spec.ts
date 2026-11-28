import { barberPerformsService } from './barber-service-guard';
import type { BarberServiceMatrix } from './barber-service-matrix';

const matrix: BarberServiceMatrix = new Map([
  ['barber-1', new Map([['loc-1', new Set(['haircut', 'beard'])]])],
  ['barber-2', new Map([['loc-1', new Set(['haircut'])]])],
]);

describe('barberPerformsService', () => {
  it('accepts a barber assigned to the service at the location', () => {
    expect(
      barberPerformsService(matrix, { locationId: 'loc-1', barberId: 'barber-2', serviceId: 'haircut' })
    ).toBe(true);
  });

  it('rejects another barber when the service is assigned to someone else', () => {
    expect(
      barberPerformsService(matrix, { locationId: 'loc-1', barberId: 'barber-2', serviceId: 'beard' })
    ).toBe(false);
  });

  it('falls back to all services when the matrix has nothing for that location', () => {
    expect(
      barberPerformsService(matrix, { locationId: 'loc-2', barberId: 'barber-1', serviceId: 'haircut' })
    ).toBe(true);
  });

  it('keeps the all-services default when the matrix is empty or has no match', () => {
    const empty: BarberServiceMatrix = new Map();
    expect(barberPerformsService(empty, { locationId: 'loc-1', barberId: 'barber-9', serviceId: 'haircut' })).toBe(
      true
    );
    expect(
      barberPerformsService(matrix, { locationId: 'loc-1', barberId: 'barber-9', serviceId: 'tattoo' })
    ).toBe(true);
  });
});
