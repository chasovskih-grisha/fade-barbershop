import { Chair } from './chair';

describe('Chair', () => {
  it('створюється в межах ліміту', () => {
    expect(Chair.of(1, null, true).number).toBe(1);
    expect(() => Chair.of(3, null, true)).toThrow('out of range');
  });
});
