export type StaffRole = 'owner' | 'senior_barber' | 'barber' | 'receptionist' | 'auditor';

export interface StaffMemberRoleConfig {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  locationId: string;
  permissions: {
    canManageStaff: boolean;
    canViewAnalytics: boolean;
    canOverridePrices: boolean;
    canManageSchedule: boolean;
  };
  updatedAt: string;
}

export const DEFAULT_STAFF_ROLES: StaffMemberRoleConfig[] = [
  {
    id: 'staff-1',
    name: 'Олександр Березюк',
    email: 'oleksandr@fade.barbershop',
    role: 'owner',
    locationId: 'loc-kiev-1',
    permissions: {
      canManageStaff: true,
      canViewAnalytics: true,
      canOverridePrices: true,
      canManageSchedule: true,
    },
    updatedAt: '2026-11-12T10:00:00Z',
  },
  {
    id: 'staff-2',
    name: 'Максим Коваль',
    email: 'maksym@fade.barbershop',
    role: 'senior_barber',
    locationId: 'loc-kiev-1',
    permissions: {
      canManageStaff: false,
      canViewAnalytics: true,
      canOverridePrices: true,
      canManageSchedule: true,
    },
    updatedAt: '2026-11-12T11:30:00Z',
  },
  {
    id: 'staff-3',
    name: 'Андрій Мельник',
    email: 'andrii@fade.barbershop',
    role: 'barber',
    locationId: 'loc-lviv-1',
    permissions: {
      canManageStaff: false,
      canViewAnalytics: false,
      canOverridePrices: false,
      canManageSchedule: false,
    },
    updatedAt: '2026-11-11T14:20:00Z',
  },
  {
    id: 'staff-4',
    name: 'Ірина Шевченко',
    email: 'iryna@fade.barbershop',
    role: 'receptionist',
    locationId: 'loc-kiev-1',
    permissions: {
      canManageStaff: false,
      canViewAnalytics: false,
      canOverridePrices: false,
      canManageSchedule: true,
    },
    updatedAt: '2026-11-10T09:15:00Z',
  },
];

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Власник (Owner)',
  senior_barber: 'Старший Барбер (Senior Barber)',
  barber: 'Барбер (Barber)',
  receptionist: 'Адміністратор / Ресепшн',
  auditor: 'Аудитор (Auditor)',
};
