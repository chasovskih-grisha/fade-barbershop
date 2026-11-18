'use client';

import React from 'react';
import { useStaffRoles } from './use-staff-roles';
import { StaffRole } from './types';

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
    ROLE_LABELS,
  } = useStaffRoles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Керування ролями та правами доступу (RBAC)</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Налаштування рівнів доступу адміністраторів, старших барберів та персоналу в мережі FADE. Всього співробітників: {totalCount}.
          </p>
        </div>
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-medium animate-fadeIn">
            ✓ {successMessage}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 mb-1">Пошук за ім'ям або email</label>
          <input
            type="text"
            placeholder="Введіть ім'я чи email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 mb-1">Фільтр за роллю</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="all">Усі ролі</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 mb-1">Фільтр за локацією</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="all">Усі локації</option>
            <option value="loc-kiev-1">FADE Kyiv Central</option>
            <option value="loc-lviv-1">FADE Lviv Rynok</option>
          </select>
        </div>
      </div>

      {/* Staff Roles Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                <th className="py-3 px-4">Співробітник</th>
                <th className="py-3 px-4">Поточна роль</th>
                <th className="py-3 px-4">Локація</th>
                <th className="py-3 px-4 text-center">Керування персоналом</th>
                <th className="py-3 px-4 text-center">Аналітика</th>
                <th className="py-3 px-4 text-center">Зміна цін</th>
                <th className="py-3 px-4 text-center">Розклад</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Співробітників за заданими критеріями не знайдено.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-neutral-900">{staff.name}</div>
                      <div className="text-xs text-neutral-500">{staff.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={staff.role}
                        onChange={(e) => updateStaffRole(staff.id, e.target.value as StaffRole)}
                        className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 text-neutral-600">
                      {staff.locationId === 'loc-kiev-1' ? 'Kyiv Central' : 'Lviv Rynok'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={staff.permissions.canManageStaff}
                        onChange={(e) => updatePermission(staff.id, 'canManageStaff', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={staff.permissions.canViewAnalytics}
                        onChange={(e) => updatePermission(staff.id, 'canViewAnalytics', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={staff.permissions.canOverridePrices}
                        onChange={(e) => updatePermission(staff.id, 'canOverridePrices', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={staff.permissions.canManageSchedule}
                        onChange={(e) => updatePermission(staff.id, 'canManageSchedule', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
