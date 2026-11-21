import type { StaffMemberRoleConfig, StaffRole } from './types';

export interface StaffFilters {
  staff: StaffMemberRoleConfig[];
  selectedLocation: string;
  selectedRole: string;
  searchQuery: string;
}

export function filterStaff({
  staff,
  selectedLocation,
  selectedRole,
  searchQuery,
}: StaffFilters): StaffMemberRoleConfig[] {
  return staff.filter((member) => {
    const matchesLoc = selectedLocation === 'all' || member.locationId === selectedLocation;
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLoc && matchesRole && matchesSearch;
  });
}

export function defaultPermissionsForRole(
  role: StaffRole,
  current: StaffMemberRoleConfig['permissions']
): StaffMemberRoleConfig['permissions'] {
  switch (role) {
    case 'owner':
      return {
        canManageStaff: true,
        canViewAnalytics: true,
        canOverridePrices: true,
        canManageSchedule: true,
      };
    case 'senior_barber':
      return {
        canManageStaff: false,
        canViewAnalytics: true,
        canOverridePrices: true,
        canManageSchedule: true,
      };
    case 'barber':
      return {
        canManageStaff: false,
        canViewAnalytics: false,
        canOverridePrices: false,
        canManageSchedule: false,
      };
    case 'receptionist':
      return {
        canManageStaff: false,
        canViewAnalytics: false,
        canOverridePrices: false,
        canManageSchedule: true,
      };
    case 'auditor':
      return {
        canManageStaff: false,
        canViewAnalytics: true,
        canOverridePrices: false,
        canManageSchedule: false,
      };
    default:
      return { ...current };
  }
}
