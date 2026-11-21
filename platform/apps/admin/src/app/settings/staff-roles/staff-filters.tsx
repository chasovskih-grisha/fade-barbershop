'use client';

// T-2100c: Фільтри каталогу співробітників — пошук, роль, локація.
import { Card, Select, TextField } from '@fade/ui';
import { ROLE_LABELS } from './types';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Усі локації' },
  { value: 'loc-kiev-1', label: 'FADE Kyiv Central' },
  { value: 'loc-lviv-1', label: 'FADE Lviv Rynok' },
];

interface StaffFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedRole: string;
  setSelectedRole: (value: string) => void;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
}

export default function StaffFilters({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedLocation,
  setSelectedLocation,
}: StaffFiltersProps) {
  return (
    <Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TextField
          label="Пошук за ім'ям або email"
          placeholder="Введіть ім'я чи email..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select
          label="Фільтр за роллю"
          options={ROLE_OPTIONS}
          value={selectedRole}
          onChange={setSelectedRole}
        />
        <Select
          label="Фільтр за локацією"
          options={LOCATION_OPTIONS}
          value={selectedLocation}
          onChange={setSelectedLocation}
        />
      </div>
    </Card>
  );
}
