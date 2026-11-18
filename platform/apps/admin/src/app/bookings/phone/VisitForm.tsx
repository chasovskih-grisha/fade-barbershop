'use client';

// Крок 2 (T-4409 UI): форма візиту після верифікації номера.
import { useState } from 'react';
import { AlertBanner } from '@fade/ui';
import { VerifiedClientCard } from './VerifiedClientCard';
import { VisitFormFields } from './VisitFormFields';
import { useVisitRefs } from './useVisitRefs';

interface VisitFormProps {
  phone: string;
  /** Client.id з верифікованого OTP — пишемо в origin.clientId (T-046). */
  clientId: string;
  onCreated: () => void;
}
export default function VisitForm({ phone, clientId, onCreated }: VisitFormProps) {
  const { locations, barbers, refsState, refsError, loadRefs } = useVisitRefs();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Обрана послуга — у формі, бо вона вмикає кнопку створення (T-4738).
  const [serviceId, setServiceId] = useState('');

  const createVisit = async (): Promise<void> => {
    const locationId = String(document.querySelector<HTMLSelectElement>('#locationId')?.value);
    const barberId = String(document.querySelector<HTMLSelectElement>('#barberId')?.value);
    const date = String(document.querySelector<HTMLSelectElement>('#date')?.value);
    const start = String(document.querySelector<HTMLInputElement>('[name="selectedStart"]')?.value);
    const end = String(document.querySelector<HTMLInputElement>('[name="selectedEnd"]')?.value);
    const serviceDuration = Number(
      document.querySelector<HTMLInputElement>('[name="serviceDuration"]')?.value
    );

    if (!locationId || !serviceId || !barberId || !date || !start || !end) {
      setError('Оберіть локацію, послугу, барбера і час');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = await fetch('/admin/bookings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId,
          locationId,
          serviceId,
          date,
          start,
          end,
          serviceDuration,
          origin: { clientId, source: 'admin' },
        }),
      });

      if (response.ok) {
        onCreated();
        return;
      }

      setError(
        response.status === 409 ? 'Слот зайнятий — оберіть інший час' : 'Не вдалося створити візит'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void createVisit();
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Створення візиту">
      <VerifiedClientCard phone={phone} clientId={clientId} />
      {refsState === 'error' && (
        <AlertBanner
          tone="error"
          title={refsError}
          action={{ label: 'Спробувати ще раз', onClick: () => void loadRefs() }}
        >
          Локації та барбери недоступні. Перевірте сесію і спробуйте ще раз.
        </AlertBanner>
      )}
      <VisitFormFields
        locations={locations}
        barbers={barbers}
        refsState={refsState}
        serviceId={serviceId}
        onServiceChange={setServiceId}
      />
      {error && (
        <p role="alert" className="mb-3 text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="border rounded px-4 py-2"
        disabled={busy || refsState !== 'ready' || !serviceId}
      >
        {busy ? 'Створення…' : 'Створити візит'}
      </button>
    </form>
  );
}
