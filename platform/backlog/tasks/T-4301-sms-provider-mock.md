# T-4301 · Mocked SMS-сервіс (SMSPitt) + порт з перемиканням

- **Stage**: M0 (phase 0) · **Tags**: infra, devops, backend, testing · **Complexity**: middle · **Depends on**: T-002 (compose/CI), T-010 (порт `OtpSender`)
- **StoryPoints**: 5

## What

Docker-контейнер **Mailpit** як «SMSPitt» у compose (профілі `deps`/`obs`, порт 19096), інтерфейс-порт `OtpSender` з перемиканням конфігом (`OTP_PROVIDER`): `DevOtpSender` (наявний, console — код у логах, дефолт), `MailpitOtpSender` → HTTP API контейнера (SMS як email на `<phone>@sms.dev`). Реальний SMS — лише prod (за T-4202). Web UI перегляду SMS для dev/test.

## Why

Dev/test «в темноті»: OTP-коди ніде подивитися крім логів api — SMSPitt дає Web UI як «Mailpit для SMS» і знімає блокер із задач найближчих фаз (T-4409 OTP для phone-booking, T-012 клієнтський вхід).

## Sources

- ADR 0018 (docker dev-environment); патерн T-4408 (email/Mailpit); engineering-principles.md (порти/fake)

## Done

- [x] Mailpit в compose (`smspit`), порт унікальний на 127.0.0.1 (19096)
- [x] Порт `OtpSender` + фабрика `OtpSenderFactory` (`OTP_PROVIDER`: console/mailpit) з тестами (4 юніт-спеки: дефолт, перемикання, payload, HTTP-помилка)
- [x] Тест «SMS відправлено» — живий прогін: `MailpitOtpSender.send()` → лист у Mailpit API (`To: +380991234567@sms.dev`), видно в Web UI

## Risks

- [x] **Дюп логіки**: DTO SMS-лиша перевикористовує контракт `OtpSender` (T-010) — дублювання none; email-дзеркало T-4408 братиме свій `EmailSender`, не цей клас
