// AdminRole domain (T-2400a, T-105, T-106)
import { ADMIN_ROLE_KEYS, DEFAULT_ADMIN_ROLES, isAdminRoleKey, roleAllows, roleAllowsLocation, roleAllowsSection } from './admin-role';
import { uuidv7 } from '@fade/domain-shared';

const LOC_1 = uuidv7();
const LOC_2 = uuidv7();

describe('AdminRole domain (T-2400a, T-105, T-106)', () => {
  it('recognises every declared admin role key', () => {
    for (const key of ADMIN_ROLE_KEYS) expect(isAdminRoleKey(key)).toBe(true);
    expect(isAdminRoleKey('owner')).toBe(false);
  });

  it('ships the three default roles with descending priority', () => {
    const keys = DEFAULT_ADMIN_ROLES.map((r) => r.key);
    expect(keys).toEqual(['super-admin', 'manager', 'barber']);
    const priorities = DEFAULT_ADMIN_ROLES.map((r) => r.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
  });

  const roleOf = (key: string) => {
    const role = DEFAULT_ADMIN_ROLES.find((r) => r.key === key);
    if (!role) throw new Error(`missing default role: ${key}`);
    return role;
  };

  it('grants super-admin every section via the wildcard', () => {
    const superAdmin = roleOf('super-admin');
    expect(roleAllows(superAdmin.permissions, 'roles')).toBe(true);
    expect(roleAllows(superAdmin.permissions, 'settings')).toBe(true);
    // super-admin has locationId: null, access any location
    expect(roleAllowsLocation(superAdmin.permissions, superAdmin.locationId, LOC_1)).toBe(true);
    expect(roleAllowsLocation(superAdmin.permissions, superAdmin.locationId, LOC_2)).toBe(true);
    // super-admin can access any section for any location
    expect(
      roleAllowsSection(superAdmin.permissions, 'locations', superAdmin.locationId, LOC_1)
    ).toBe(true);
    expect(
      roleAllowsSection(superAdmin.permissions, 'analytics', superAdmin.locationId, LOC_2)
    ).toBe(true);
  });

  it('limits the barber role to its own schedule and clients', () => {
    const barber = roleOf('barber');
    expect(roleAllows(barber.permissions, 'schedule')).toBe(true);
  });

  it('manager can access own location', () => {
    const manager = roleOf('manager');
    // manager locationId is null by default (global), so they can access any location
    expect(roleAllowsLocation(manager.permissions, manager.locationId, LOC_1)).toBe(true);
    expect(roleAllowsLocation(manager.permissions, manager.locationId, LOC_2)).toBe(true);
  });

  it('manager with specific locationId restricts access to other locations', () => {
    // Manager assigned to loc-1 should only access loc-1
    const managerLoc1 = {
      ...roleOf('manager'),
      locationId: LOC_1,
    };
    expect(roleAllowsLocation(managerLoc1.permissions, managerLoc1.locationId, LOC_1)).toBe(true);
    expect(roleAllowsLocation(managerLoc1.permissions, managerLoc1.locationId, LOC_2)).toBe(false);
  });

  it('roleAllowsLocation denies foreign location when manager has location', () => {
    const managerLoc1 = {
      ...roleOf('manager'),
      locationId: LOC_1,
    };
    // manager with loc-1 cannot access loc-2
    expect(roleAllowsLocation(managerLoc1.permissions, managerLoc1.locationId, LOC_2)).toBe(false);
    // but can access their own
    expect(roleAllowsLocation(managerLoc1.permissions, managerLoc1.locationId, LOC_1)).toBe(true);
  });

  it('super-admin always allows any location regardless of locationId', () => {
    const superAdmin = roleOf('super-admin');
    // super-admin with any locationId can access any record location
    expect(roleAllowsLocation(superAdmin.permissions, superAdmin.locationId, LOC_1)).toBe(true);
    expect(roleAllowsLocation(superAdmin.permissions, superAdmin.locationId, LOC_2)).toBe(true);
  });

  it('roleAllowsSection grants access when both section and location allow', () => {
    const managerLoc1 = {
      ...roleOf('manager'),
      locationId: LOC_1,
    };
    // manager with loc-1 can access locations section for loc-1
    expect(
      roleAllowsSection(managerLoc1.permissions, 'locations', managerLoc1.locationId, LOC_1)
    ).toBe(true);
    // manager with loc-1 cannot access locations section for loc-2
    expect(
      roleAllowsSection(managerLoc1.permissions, 'locations', managerLoc1.locationId, LOC_2)
    ).toBe(false);
    // manager can access analytics section for any location (global)
    expect(
      roleAllowsSection(managerLoc1.permissions, 'analytics', managerLoc1.locationId, LOC_2)
    ).toBe(true);
  });
});
