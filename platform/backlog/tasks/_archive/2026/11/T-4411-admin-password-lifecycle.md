# T-4411 · Адмін: зміна/скидання пароля, блокування, журнал входів — done 2026-09-27

- **Stage**: M1 (phase 1) · **Tags**: backend, security · **Complexity**: junior · **Depends on**: T-013
- **StoryPoints**: 3 · **Статус**: done

## What

Після T-013 (адмін-вхід за username+password) — життєвий цикл обліковки: зміна власного пароля, примусове скидання (адмін → адмін), деактивація/блокування акаунта (наприклад, при звільненні), журнал останніх входів і невдалих спроб (споживає T-3604).

## Why

Без скидання пароля і блокування обліковка = «назавжди»; журнал входів — перша марка після підозри на компрометацію.

## Sources

- admin-screens.md §0 (логоін); identity README; security-hardening.md (scrypt-паролі)

## Реалізація (2026-09-27)

- **Use cases** (`src/identity/application/admin-account.ts` + `list-login-audit.ts`):
  - `ChangeOwnPasswordHandler` — поточний пароль підтверджується; **поточна сесія живе** (свідоме рішення); невдала спроба потрапляє в аудит.
  - `ResetAdminPasswordHandler` — генерує одноразовий пароль `Fade-XXXXXXXX!` (у відповіді, **ніколи в outbox/логах**), **деактивує ціль** (безпека за замовчуванням: адмін передає пароль і активує окремим рішенням), закриває всі сесії цілі.
  - `SetAdminActiveHandler` — блокування закриває активні сесії (подія `identity.admin.deactivated` + `identity.session.revoked` на кожну); розблокування — тихий стан без подій.
- **Сесії**: `SessionRepository.revokeAllForUser` (updateMany активних) — ризик зі спеки закритий: старі куки мертві одразу (e2e «login → reset → та сама cookie → 401»).
- **Журнал входів** (`PrismaLoginAudit`): AppSetting ключ `admin.login_audit:<userId>`, JSON-кільце ≤50 спроб {ts, username, ok, actorId}; запис і успіхів, і невдач (навіть невідомих username → ключ `anonymous`). Ретеншн/SIEM — свідомо T-3604.
- **Події** (`domain/account.events.ts`): `identity.password.changed` (reason: self_change|admin_reset; payload **без хеша**) і `identity.admin.deactivated`.
- **HTTP** (`admin-account.controller.ts`, під AdminSessionGuard, actorId з cookie): POST /admin/account/password; POST /admin/admins/:id/password; POST /admin/admins/:id/active; GET /admin/admins/:id/logins.
- **Tests**: юніт-спеки (гілки guard'ів, `??` fallback, аудит, revoke-ідемпотентність) + e2e (зміна власного: старий пароль 401/новий 200/сесія жива; **обов'язковий тест ризику** скидання; блокування/розблокування; guard 401/403). Фейки — `admin-client-otp.fakes.ts` (MemUsers/MemSessions+revokeAllForUser/MemLoginAudit).

## Done

- [x] Зміна/скидання/блокування пароля працюють (з блокуванням активних сесій)
- [x] Невдалі входи логуються і видно адміну (GET /admin/admins/:id/logins)
- [x] Юніт-Tests на сценарії обліковки

## Журнал поза транзакцією входу (2026-09-29)

AdminLogin: успіх пишеться в журнал ПІСЛЯ коміту uow.run (транзакція фіксує лише сесію + outbox) — відкотена транзакція не залишає success-запису; невдачі креденшлів/доступу пишуться в catch і переживають відкат (PrismaLoginAudit через базовий клієнт); userId сетиться одразу після findByUsername — кільце відомого користувача, а не anonymous; серверні збої (падіння uow) журнал не забруднюють — вони не є невдалим входом. Гарантії — admin-login.audit.spec.ts (порядок uow:commit → audit:ok; відкат → журнал чистий; кільце відомого користувача). Живо: wrong password 401 → FAIL у кільці owner, успішний логін → OK після коміту.

## Signals: серія невдалих входів (2026-09-29)

`failedStreakOf` — підряд невдалі спроби на голові кільця одного користувача (`failedStreak` у відповідях обох list-хендлерів); UI StreakBanner: ≥3 = alert «ймовірний перебір пароля», 1–2 = info. Живо: три 401 → failedStreak=3. Пороги статичні, IP-кореляція — T-4410, SIEM — T-3604.

## Owner-подання журналу входів (2026-09-29, read-side)

`ListAllAdminLoginsHandler` + `GET /admin/admins/logins?userId=&limit=`: злиття per-admin кілець AppSetting (≤50 на адміна) усіх адмінів (`listAdminIds`), сортування новіші-першими, зріз після злиття (дефолт 50, max 200); `?userId=` — фільтр за користувачем. Права — той самий AdminSessionGuard (без нових прав; гість 401). М'яка відмова відсутнього кільця. UI `/settings/logins`: перемикач «Мій журнал / Усі адміністратори» (LoginsFilters), колонка «Адмін» зі скороченим userId, фільтр-список адмінів з першого all-запиту. Жива верифікація: два адміни (owner OK + support FAIL) в одному поданні, фільтр звужує, гість 401.

## Risks

- [x] **Сесія після скидання**: старі токени/куки інвалідуються — тест обов'язковий (e2e + юніт)
