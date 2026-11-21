'use client';

import { useCallback, useState } from 'react';
import { defaultPermissionsForRole, filterStaff } from './staff-role-utils';
import {
  DEFAULT_STAFF_ROLES,
  ROLE_LABELS,
  type StaffMemberRoleConfig,
  type StaffRole,
} from './types';

export function useStaffRoles() {
  const [staffList, setStaffList] = useState<StaffMemberRoleConfig[]>(DEFAULT_STAFF_ROLES);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredStaff = filterStaff({
    staff: staffList,
    selectedLocation,
    selectedRole,
    searchQuery,
  });

  const updateStaffRole = useCallback((id: string, newRole: StaffRole) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === id
          ? {
              ...staff,
              role: newRole,
              permissions: defaultPermissionsForRole(newRole, staff.permissions),
              updatedAt: new Date().toISOString(),
            }
          : staff
      )
    );
    setSuccessMessage('Роль співробітника успішно оновлено!');
    setTimeout(() => setSuccessMessage(null), 3500);
  }, []);

  const updatePermission = useCallback(
    (id: string, permissionKey: keyof StaffMemberRoleConfig['permissions'], value: boolean) => {
      setStaffList((prev) =>
        prev.map((staff) =>
          staff.id === id
            ? {
                ...staff,
                permissions: { ...staff.permissions, [permissionKey]: value },
                updatedAt: new Date().toISOString(),
              }
            : staff
        )
      );
      setSuccessMessage('Права доступу оновлено!');
      setTimeout(() => setSuccessMessage(null), 3500);
    },
    []
  );

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
