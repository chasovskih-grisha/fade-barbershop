// OtpSenderFactory — вибір відправника OTP за конфігом (T-4301/T-4400, патерн
// ADR 0050 геокодера): `OTP_PROVIDER=console` (дефолт) — DevOtpSender (код у
// логах); `mailpit` — MailpitOtpSender (Web UI Mailpit); `sms` — реальний
// прод-провайдер HttpOtpSender (T-4400). За наявності `SMS_FALLBACK_URL`
// основний провайдер обгортається FallbackOtpSender: деградація → резерв, а не
// відмова входу. Ключі — з env (secret manager T-300), не з репозиторію.
import { Injectable } from '@nestjs/common';
import { DevOtpSender } from './dev-otp-sender';
import { MailpitOtpSender } from './mailpit-otp-sender';
import { HttpOtpSender, type HttpOtpSenderConfig } from './http-otp-sender';
import { FallbackOtpSender } from './fallback-otp-sender';
import type { OtpSender } from '../domain/ports';

export type OtpProviderName = 'console' | 'mailpit' | 'sms';

export interface OtpSenderEnv {
  OTP_PROVIDER?: string;
  MAILPIT_URL?: string;
  SMS_PROVIDER_URL?: string;
  SMS_PROVIDER_TOKEN?: string;
  SMS_PROVIDER_SENDER?: string;
  SMS_FALLBACK_URL?: string;
  SMS_FALLBACK_TOKEN?: string;
}

/** Прод-провайдер з env. Кидає, якщо URL/токен не задані: краще впасти на
 * старті, ніж мовчки піти в console-дефолт і не доставити жодного коду. */
function buildHttp(env: OtpSenderEnv, fallback: boolean): OtpSender {
  const prefix = fallback ? 'SMS_FALLBACK' : 'SMS_PROVIDER';
  const url = env[(prefix + '_URL') as keyof OtpSenderEnv];
  const token = env[(prefix + '_TOKEN') as keyof OtpSenderEnv];
  if (!url || !token) {
    throw new Error(`OTP_PROVIDER=sms вимагає ${prefix}_URL і ${prefix}_TOKEN (T-4400)`);
  }
  const config: HttpOtpSenderConfig = { url, token, sender: env.SMS_PROVIDER_SENDER ?? 'FADE' };
  return new HttpOtpSender(config);
}

@Injectable()
export class OtpSenderFactory {
  build(env: OtpSenderEnv = process.env): OtpSender {
    const provider = (env.OTP_PROVIDER ?? 'console') as OtpProviderName;
    if (provider === 'sms') {
      const primary = buildHttp(env, false);
      return env.SMS_FALLBACK_URL ? new FallbackOtpSender(primary, buildHttp(env, true)) : primary;
    }
    if (provider === 'mailpit') {
      return new MailpitOtpSender(env.MAILPIT_URL ?? 'http://localhost:19096');
    }
    return new DevOtpSender();
  }
}
