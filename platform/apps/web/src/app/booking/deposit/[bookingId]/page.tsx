'use client';

import { useParams } from 'next/navigation';
import { ResumeDeposit } from '../ResumeDeposit';

export default function ResumeDepositPage() {
  const raw = useParams<{ bookingId: string }>().bookingId;
  const bookingId = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  return <ResumeDeposit bookingId={bookingId} />;
}
