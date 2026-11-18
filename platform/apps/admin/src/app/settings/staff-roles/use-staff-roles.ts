'use client';

import { useState, useCallback } from 'react';
import { StaffMemberRoleConfig, StaffRole, DEFAULT_STAFF_ROLES, ROLE_LABELS } from './types';

export function useStaffRoles() {
  const [staffList, setStaffList] = useState<StaffMemberRoleConfig[]>(DEFAULT_STAFF_ROLES);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredStaff = staffList.filter((staff) => {
    const matchesLoc = selectedLocation === 'all' || staff.locationId === selectedLocation;
    const matchesRole = selectedRole === 'all' || staff.role === selectedRole;
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLoc && matchesRole && matchesSearch;
  });

  const updateStaffRole = useCallback((id: string, newRole: StaffRole) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        // Default permissions based on role
        let defaultPerms = { ...s.permissions };
        if (newRole === 'owner') {
          defaultPerms = { canManageStaff: true, canViewAnalytics: true, canOverridePrices: true, canManageSchedule: true };
        } else if (newRole === 'senior_barber') {
          defaultPerms = { canManageStaff: false, canViewAnalytics: true, canOverridePrices: true, canManageSchedule: true };
        } else if (newRole === 'barber') {
          defaultPerms = { canManageStaff: false, canViewAnalytics: false, canOverridePrices: false, canManageSchedule: false };
        } else if (newRole === 'receptionist') {
          defaultPerms = { canManageStaff: false, canViewAnalytics: false, canOverridePrices: false, canManageSchedule: true };
        } else if (newRole === 'auditor') {
          defaultPerms = { canManageStaff: false, canViewAnalytics: true, canOverridePrices: false, canManageSchedule: false };
        }

        return {
          ...s,
          role: newRole,
          permissions: defaultPerms,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setSuccessMessage('Роль співробітника успішно оновлено!');
    setTimeout(() => setSuccessMessage(null), 3500);
  }, []);

  const updatePermission = useCallback((id: string, permissionKey: keyof StaffMemberRoleConfig['permissions'], value: boolean) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          permissions: {
            ...s.permissions,
            [permissionKey]: value,
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setSuccessMessage('Права доступу оновлено!');
    setTimeout(() => setSuccessMessage(null), 3500);
  }, []);

  return {
    staffList: filteredStaff,
    totalCount: staffList.length,
    selectedLocation,
    setSelectedLocation,
    selectedRole,
    setSelectedRole,
    searchQuery,
    setSearchQuery,
    updateStaffRole,
    updatePermission,
    successMessage,
    ROLE_LABELS,
  };
}
