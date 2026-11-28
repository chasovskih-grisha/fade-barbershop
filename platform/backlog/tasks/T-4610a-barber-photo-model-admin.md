# T-4610a · Модель фото барбера, згода і завантаження в адмінці (5/8)

- **Stage**: M1 (phase 2) · **Tags**: backend, frontend, privacy, design · **Complexity**: middle · **Depends on**: T-4609a, T-023, T-4507
- **StoryPoints**: 5

## What

Дані й керування — половина T-4610, без якої публічні картки (T-4610b) не матимуть чого показувати.

**Модель.** `BarberPhoto`: `userId` unique → `User` (барбер — це `User` з `role = "barber"`, `schema.prisma:12`; `AppointmentParty.barberId` посилається саме на нього, `:107`), `url`, `alt` (not null), `width`, `height`, `consentAt`, `consentBy`, `updatedAt`. migration + інваріант «`role = 'barber'`» (спроба прив'язати фото до клієнта — помилка). Сховище — публічний медіа-конвеєр `PublicMediaStorage` з T-4609a (не третій `PhotoStorage`).

**Consent — частина моделі, а не галочка.** Фото барбера публікується на сайті: персональні дані працівника (ADR 0015). Стани: `draft` (завантажено, згоди none → публічно не віддається) / `published` (`consentAt` + `consentBy` зафіксовані). Відкликання згоди → `published` знімається, фото або видаляється, або залишається в адміні для внутрішнього користування (вибір фіксується в AC).

**Адмін-UI.** Картка/форма барбера в `apps/admin/src/app/barbers` (сьогодні форма створення має лише «Ім'я» + «Телефон» + activate/deactivate — `BarbersManager.tsx`): секція «Фото» через `PhotoUpload` (вже є, T-004, з consent-чекбоксом), прев'ю, заміна, видалення, дата оновлення. Consent-чекбокс **не** приходить передзаповленим (вимога `docs/components/PhotoUpload.md:46`); порядок — consent → «Опублікувати».

## Why

Публічна картка барбера не має фото — none ні моделі, ні завантаження, ні адмін-контролу; `BarberDto` без фото, а `Avatar` (T-4507d) — лише відмальований компонент. Тому публікація фото барбера в T-4610b була б неможливою без цієї половини.

## Sources

- `admin-screens.md` §3–5 (персонал/барбери), `MNG-ADM-05`/`MNG-ADM-06`; `docs/components/PhotoUpload.md` (consent-чекбокс, обов'язково не приховано)
- `booking-flow.md:114` (фото опційно на картці); `design-system.md` §Компоненти (Avatar)
- ADR 0015 (персональні дані, згода, відкликання), ADR 0019 (LOC < 100, короткі ключі об'єктів)
- T-4609a (`PublicMediaStorage`), T-4507/T-4507d, T-023 (done), T-002 (done)

## Done

- [ ] `BarberPhoto` + migration; інваріант «лише `User.role = 'barber'`» (тест)
- [ ] Стани `draft` / `published`; `consentAt` + `consentBy` обов'язкові для `published`; відкликання згоди → не публікується
- [ ] Секція «Фото» в адмінці: завантаження, прев'ю, заміна, видалення, дата оновлення
- [ ] Consent-чекбокс через `PhotoUpload`, **не** прихований; «Опублікувати» лише після згоди
- [ ] `alt` обов'язковий; файл перевіряється (тип, розмір) і приводиться до square із фокусом
- [ ] Юніт-Tests на інваріант і стан згоди; e2e на завантаження, заміну, видалення, відкликання
- [ ] `pnpm docs:validate` зелений

## Audit 2026-11-24

Reopened. The model, migration, invariant, admin section and consent path are
present, but `SetBarberPhotoHandler` stores the media pipeline’s default resize
and writes `width: null`/`height: null`; there is no square crop or focus point.
There is no upload/replace/delete/revoke e2e, only application/unit specs. The
Done claim for square-with-focus and the e2e coverage is therefore false.

## Risks

- [ ] **Consent зроблено формальністю** (чекбокс без фіксації часу/хто підтвердив) — знецінює доказову базу; `consentAt`/`consentBy` обов'язкові в схемі
- [ ] **Залишкове фото після відкликання згоди** залишається в публічному CDN-кеші — потрібна інвалідація (Verify, що реально працює)
- [ ] **Автоматичний crop по центру** псує фото з виносом; square із налаштованим фокусом
- [ ] **Consent для чужого фото** (завантажений не той барбер) — інваріант по `userId` не захищає від помилки людини; перевірка прив'язки в UI
- [ ] **Плутанина з референсом для AI** (той самий `PhotoUpload`) — помилковий бакет/приватність
