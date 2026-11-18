'use client';

// Барбери (MNG-ADM-04…06): створення, статуси, закріплення за локаціями,
// графік, фото та продуктивність/відпустки. Логіка — useBarbersDirectory, розмітка — тут.
import { useState, type FormEvent } from 'react';
import PageHeader from '../components/PageHeader';
import { useAdminToasts } from '../components/use-admin-toasts';
import AvailabilityEditor from './AvailabilityEditor';
import BarberServiceMatrixEditor from './BarberServiceMatrixEditor';
import StaffAssignmentEditor from './StaffAssignmentEditor';
import BarberPhotoSection from './BarberPhotoSection';
import BarberPerformanceSection from './BarberPerformanceSection';
import { BarberCreateForm } from './BarberCreateForm';
import { BarbersTable } from './BarbersTable';
import { useBarbersDirectory } from './use-barbers-directory';

export default function BarbersManager() {
  const { barbers, locations, error, saving, create, toggle, savePhoto, removePhoto } = useBarbersDirectory();
  const { push, viewport } = useAdminToasts();
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void create(name, phone, () => {
      setName('');
      setPhone('');
      push('Барбера створено');
    });
  };

  const changeStatus = (barber: Parameters<typeof toggle>[0]) => {
    void toggle(barber).then((ok) => {
      if (ok) push(barber.active ? 'Барбера деактивовано' : 'Барбера активовано');
    });
  };

  return (
    <main>
      <PageHeader title="Барбери" subtitle="Команда: статуси, закріплення за локаціями, графіки" />
      <BarberCreateForm
        name={name}
        phone={phone}
        busy={saving}
        onNameChange={setName}
        onPhoneChange={setPhone}
        onSubmit={submit}
      />
      {error && (
        <p role="alert" className="mt-3">
          {error}
        </p>
      )}{' '}
      <BarbersTable
        barbers={barbers}
        selected={selected}
        onToggle={changeStatus}
        onSelect={setSelected}
      />
      {viewport}
      {barbers
        .filter((barber) => barber.id === selected)
        .map((barber) => (
          <div key={barber.id} className="mt-5 space-y-4">
            <h2 className="font-display text-h4">{barber.name ?? barber.phone}</h2>
            <BarberPhotoSection
              barberId={barber.id}
              initialPhoto={barber.photo}
              onSave={(file, alt, consent) => savePhoto(barber.id, file, alt, consent)}
              onRemove={() => removePhoto(barber.id)}
              saving={saving}
            />
            <StaffAssignmentEditor barberId={barber.id} locations={locations} />
            <BarberServiceMatrixEditor barberId={barber.id} locations={locations} />
            <AvailabilityEditor barberId={barber.id} locations={locations} />
            <BarberPerformanceSection barberId={barber.id} />
          </div>
        ))}
    </main>
  );
}
