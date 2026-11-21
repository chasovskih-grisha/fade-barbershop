'use client';

import { AlertBanner, Card } from '@fade/ui';
import { useStaffRoles } from './use-staff-roles';
import StaffFilters from './staff-filters';
import StaffRolesTable from './staff-roles-table';

export function StaffRolesManager() {
  const {
    staffList,
    totalCount,
    selectedLocation,
    setSelectedLocation,
    selectedRole,
    setSelectedRole,
    searchQuery,
    setSearchQuery,
    updateStaffRole,
    updatePermission,
    successMessage,
  } = useStaffRoles();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-display text-h3 text-fg">Керування ролями та правами доступу (RBAC)</h2>
        <p className="mt-1 text-body text-fg-muted">
          Налаштування рівнів доступу адміністраторів, старших барберів та персоналу в мережі FADE.
          Всього співробітників: {totalCount}.
        </p>
      </Card>

      {successMessage ? (
        <AlertBanner tone="success" title="Успіх">
          {successMessage}
        </AlertBanner>
      ) : null}

      <StaffFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />

      <Card padding="none">
        <StaffRolesTable
          staffList={staffList}
          updateStaffRole={updateStaffRole}
          updatePermission={updatePermission}
        />
      </Card>
    </div>
  );
}
