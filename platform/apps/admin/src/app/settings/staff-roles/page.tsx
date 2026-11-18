import React from 'react';
import { StaffRolesManager } from './StaffRolesManager';

export const metadata = {
  title: 'Керування ролями співробітників | FADE Admin',
  description: 'Адміністрування рівнів доступу та прав ролей персоналу.',
};

export default function StaffRolesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <StaffRolesManager />
    </div>
  );
}
