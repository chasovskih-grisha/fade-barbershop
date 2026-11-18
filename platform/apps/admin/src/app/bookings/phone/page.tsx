'use client';

// Телефонний запис (admin-screens §6.2 → T-4409 UI): адмін ініціює OTP на
// номер клієнта, вводить код, прочитаний клієнтом, → верифікація фіксує
// phoneVerifiedAt; далі — форма візиту (POST /admin/bookings, T-041 бекенд).
//
// T-046: «Записати» з картки клієнта CRM веде сюди з ?clientId=&phone= —
// клієнт уже відомий, OTP-крок пропускається і форма візиту відкривається
// одразу з карткою верифікованого клієнта. Без clientId (лише ?phone=)
// стартуємо зі звичайного OTP-кроку з підставленим номером. ClientId без
// phone (картка без номера — теоретично) — теж skip-OTP: номер підтягне
// VerifiedClientCard із CRM.
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import OtpStep from './OtpStep';
import VisitForm from './VisitForm';
import { usePhoneOtp } from './usePhoneOtp';

type Step = 'otp' | 'visit' | 'done';

/** Параметри «Записати» з CRM (T-046). clientId — User.id клієнта. */
interface Preselect {
  clientId: string;
  phone: string;
}

function readPreselect(search: URLSearchParams | null): Preselect | null {
  const clientId = search?.get('clientId')?.trim() ?? '';
  const phone = search?.get('phone')?.trim() ?? '';
  if (!clientId && !phone) return null;
  // clientId без phone теж валидний: картка клієнта дає номер, але вирішально
  // для skip-OTP саме clientId; phone без clientId — просто підстановка номера.
  return { clientId, phone };
}

export default function PhoneBookingPage() {
  const { busy, error, request, verify } = usePhoneOtp();
  const preselect = readPreselect(useSearchParams());
  // Ініціалізатори useState мають бути чистими: preselect читається з URL
  // лише на першому рендері (навігація з CRM — нове монтування сторінки).
  const [step, setStep] = useState<Step>(preselect?.clientId ? 'visit' : 'otp');
  const [phone, setPhone] = useState(preselect?.phone ?? '');
  const [code, setCode] = useState('');
  // Client.id, підтверджений на кроці OTP або взятий із запиту CRM: без нього
  // візит створювався б без привʼязки до клієнта (origin.clientId = null, T-046).
  const [clientId, setClientId] = useState(preselect?.clientId ?? '');

  if (step === 'done') {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Телефонний запис" subtitle="Крок 3 з 3 — запис створено" />
        <p role="status">Візит створено.</p>
      </div>
    );
  }

  if (step === 'visit') {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Телефонний запис" subtitle="Крок 2 з 3 — дані візиту" />
        <VisitForm phone={phone} clientId={clientId} onCreated={() => setStep('done')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Телефонний запис" subtitle="Крок 1 з 3 — верифікація номера" />
      <OtpStep
        phone={phone}
        code={code}
        busy={busy}
        error={error}
        onPhoneChange={setPhone}
        onCodeChange={setCode}
        onSend={() => void request(phone)}
        onConfirm={() =>
          void verify(phone, code).then((result) => {
            if (!result) return;
            setClientId(result.clientId);
            setStep('visit');
          })
        }
      />
    </div>
  );
}
