import { TextField } from '@fade/ui';
import type { AddressPartsValue } from '../location-geocode-client';

export default function ProfileAddressFields({
  parts,
  onChange,
  disabled,
}: {
  parts: AddressPartsValue;
  onChange: (patch: Partial<AddressPartsValue>) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField
        label="Вулиця"
        value={parts.street}
        onChange={(event) => onChange({ street: event.target.value })}
        disabled={disabled}
      />
      <TextField
        label="Будинок"
        value={parts.building}
        onChange={(event) => onChange({ building: event.target.value })}
        disabled={disabled}
      />
      <TextField
        label="Місто"
        value={parts.city}
        onChange={(event) => onChange({ city: event.target.value })}
        disabled={disabled}
      />
      <TextField
        label="Індекс (необов’язково)"
        value={parts.postalCode ?? ''}
        onChange={(event) => onChange({ postalCode: event.target.value })}
        disabled={disabled}
      />
    </div>
  );
}
