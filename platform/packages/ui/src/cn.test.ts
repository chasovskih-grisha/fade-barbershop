import { cn } from './cn';

describe('cn', () => {
  it('зливає класи через пробіл', () => {
    expect(cn('bg-surface-base', 'text-fg')).toBe('bg-surface-base text-fg');
  });

  it('відкидає falsy-значення', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b');
  });

  it('повертає порожній рядок без класів', () => {
    expect(cn()).toBe('');
  });
});
