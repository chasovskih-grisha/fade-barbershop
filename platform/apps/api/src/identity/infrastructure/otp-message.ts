// Текст OTP-повідомлення за призначенням коду (T-4301/T-4400): одна точка
// правди для dev-дзеркала Mailpit і прод-провайдера — клієнт бачить той самий
// текст у будь-якому каналі. digits потрапляють лише в тіло, ніколи в логи.
import type { OtpPurpose } from '../domain/ports';

const PREFIX: Record<OtpPurpose, string> = {
  login: 'Код підтвердження Fade',
  booking: 'Код для запису по телефону',
  phone_change: 'Код для зміни номера телефону',
};

export function renderOtpText(purpose: OtpPurpose, digits: string): string {
  return `${PREFIX[purpose] ?? PREFIX.login}: ${digits}`;
}
