'use client';

// T-2100c: Таблиця ролей і прав доступу. Роль і прапорець — єдині редаговані поля.
import { Checkbox, Select, Table, TBody, TD, TH, THead, TR } from '@fade/ui';
import { ROLE_LABELS, type StaffMemberRoleConfig, type StaffRole } from './types';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

const PERMISSIONS: Array<{
  key: keyof StaffMemberRoleConfig['permissions'];
  label: string;
}> = [
  { key: 'canManageStaff', label: 'Керування персоналом' },
  { key: 'canViewAnalytics', label: 'Аналітика' },
  { key: 'canOverridePrices', label: 'Зміна цін' },
  { key: 'canManageSchedule', label: 'Розклад' },
];

type PermissionKey = keyof StaffMemberRoleConfig['permissions'];

interface StaffRolesTableProps {
  staffList: StaffMemberRoleConfig[];
  updateStaffRole: (id: string, role: StaffRole) => void;
  updatePermission: (id: string, key: PermissionKey, value: boolean) => void;
}

export default function StaffRolesTable({
  staffList,
  updateStaffRole,
  updatePermission,
}: StaffRolesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <THead>
          <TR>
            <TH>Співробітник</TH>
            <TH>Поточна роль</TH>
            <TH>Локація</TH>
            {PERMISSIONS.map((permission) => (
              <TH key={permission.key}>{permission.label}</TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {staffList.length === 0 ? (
            <TR>
              <TD className="text-fg-muted">Співробітників за заданими критеріями не знайдено.</TD>
            </TR>
          ) : (
            staffList.map((staff) => (
              <TR key={staff.id}>
                <TD>
                  <div className="font-medium text-fg">{staff.name}</div>
                  <div className="text-caption text-fg-muted">{staff.email}</div>
                </TD>
                <TD>
                  <Select
                    label="Роль"
                    options={ROLE_OPTIONS}
                    value={staff.role}
                    onChange={(role) => updateStaffRole(staff.id, role as StaffRole)}
                  />
                </TD>
                <TD className="text-fg-secondary">
                  {staff.locationId === 'loc-kiev-1' ? 'Kyiv Central' : 'Lviv Rynok'}
                </TD>
                {PERMISSIONS.map((permission) => (
                  <TD key={permission.key}>
                    <Checkbox
                      label={permission.label}
                      checked={staff.permissions[permission.key]}
                      onChange={(event) =>
                        updatePermission(staff.id, permission.key, event.target.checked)
                      }
                    />
                  </TD>
                ))}
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
