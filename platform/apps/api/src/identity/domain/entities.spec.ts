import { isRole, ROLES } from './role';

describe('Role', () => {
  it('відомі ролі валідні, інші — ні', () => {
    expect(ROLES).toEqual(['client', 'barber', 'admin']);
    for (const role of ROLES) expect(isRole(role)).toBe(true);
    expect(isRole('owner')).toBe(false);
  });
});
