import { pickBarber, readBarberParam } from '../barberParam';
import type { BarberDto } from '../types';

const barbers: BarberDto[] = [
  { id: 'b1', name: 'Олексій' },
  { id: 'b2', name: 'Ігор' },
];

describe('readBarberParam', () => {
  it('keeps a plain identifier', () => {
    expect(readBarberParam('b1')).toBe('b1');
  });

  it('trims surrounding spaces', () => {
    expect(readBarberParam('  b1  ')).toBe('b1');
  });

  it('rejects an empty value', () => {
    expect(readBarberParam('   ')).toBeNull();
  });

  it('rejects inner whitespace', () => {
    expect(readBarberParam('b1 b2')).toBeNull();
  });

  it('rejects an overlong value', () => {
    expect(readBarberParam('x'.repeat(65))).toBeNull();
  });

  it('rejects a non-string value', () => {
    expect(readBarberParam(42)).toBeNull();
    expect(readBarberParam(null)).toBeNull();
  });
});

describe('pickBarber', () => {
  it('keeps a barber who performs at this location', () => {
    expect(pickBarber('b2', barbers)).toBe('b2');
  });

  it('ignores an unknown barber', () => {
    expect(pickBarber('nobody', barbers)).toBeNull();
  });

  it('ignores a barber who is not in the list yet', () => {
    expect(pickBarber('b1', [])).toBeNull();
  });

  it('ignores garbage without throwing', () => {
    expect(pickBarber(undefined, barbers)).toBeNull();
  });
});
