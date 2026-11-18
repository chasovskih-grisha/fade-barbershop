# T-4609a · Конвеєр асетів бренду, модель логотипа локації і адмін-UI (5/14)

- **Stage**: M1 (phase 2) · **Tags**: backend, frontend, design, branding · **Complexity**: middle · **Depends on**: T-021, T-4406, T-002
- **StoryPoints**: 5
- **Пріоритет**: найвищий, перший у T-4609. Без `exports` b/c/d не імпортують знак.

## What

Дані і керування — половина задачі T-4609. Публічний хром (T-4609b/c/d) імпортує файли звідси.

**Стан на 2026-11-09.** Пакет, `sync`/`verify`, крок CI, `PublicMediaStorage`, модель `LocationLogo` і секція «Логотип» уже в дереві. Жодний application пакет не імпортує: у `package.json` none `exports`.

**Конвеєр асетів.** `packages/brand-assets`: svg бренду (`mark-fa`, `mark-fa-on-dark`, `mark-fa-on-milk`, `lockup`, `lockup-on-dark`, `lockup-on-milk`, `favicon`, `app-icon-1024.svg`), README з походженням і скрипт `sync` + `verify`. Правило: джерело правди — `brand/logo/system/`, пакет — збутковий артефакт. `exports` віддає `./assets/*`, щоб сусіди імпортували файл, а не копіювали його в `public/`. PNG іконки застосунку додає T-4609d.

**Порт медіа.** `PublicMediaStorage` у `shared/` — сестринський до `PhotoStorage` (T-043), але для **неперсональних** зображень: публічний бакет (`location-brand`, окремо від приватних з T-001a), `put` з resize/crop і конвертацією в WebP, ключ `locations/{locationId}/{uuid}`, `delete`, публічний URL. ADR 0015 на логотип не поширюється.

**Модель.** `LocationLogo`: `id`, `locationId` (unique), `variant` (`mark` | `lockup`), `lightUrl`, `darkUrl`, `alt` (not null), `updatedAt`. migration Prisma + доменне правило «`darkUrl` без `lightUrl` → падіння на light», оскільки on-dark без on-milk непридатний.

**Адмін-UI.** Секція «Логотип» на сторінці локації поруч із контактами/галереєю (T-4406): `PhotoUpload` із `packages/ui` (вже є, T-004), preview одразу на темному і на молочному полі, вибір варіанта mark/lockup, обов'язковий `alt`, видалення. Стани: loading, помилка завантаження, невибраний варіант — не віддавати на публічну сторінку.

## Why

`Location` (`schema.prisma:125`) не має поля логотипу, `LocationPhoto` (`:189`) — галерея, а публічного медіа-конвеєра в платформі не існує взагалі: `LocationPhoto.url` у сіді — зовнішній unsplash-URL (`seed-dev.mjs:44`). Аудит 2026-09-29: жодного асету бренду в `apps/*` none (`public/` відсутній), `SiteHeader.tsx:9` малює логотип шрифтом усупереч `design-system.md` §Типографіка.

## Sources

- `brand/logo/system/` + `design-system.md` §Типографіка (правило пари), §Кольори (світла тема `Paper`/`Ink`)
- `admin-screens.md` §1.2 (форма локації); `MNG-ADM-01`; T-4406 (той самий екран)
- T-002 (бакети, done), T-043 (`PhotoStorage` — патерн порту), T-004 (`PhotoUpload`), T-021 (CRUD локацій, done)
- ADR 0015 (логотип — не персональні дані), ADR 0019 (LOC < 100)

## Done

- [x] `packages/brand-assets`: асети + README з provenance + `sync`/`verify`; розходження checksum → ненульовий exit; крок у CI
- [x] `PublicMediaStorage`: порт + адаптер, публічний бакет `location-brand`, WebP, `delete`, публічний URL
- [x] `LocationLogo` + migration; `variant`, `lightUrl`, `darkUrl`, `alt` (not null)
- [x] Доменне правило: `darkUrl` без `lightUrl` → помилка валідації (тест)
- [x] Секція «Логотип» в адмінці: завантаження, preview light/dark, mark/lockup, обов'язковий `alt`, видалення
- [x] Стани: loading, помилка завантаження, «логотип не задано»
- [x] Юніт-Tests на правило light/dark і use case; e2e на завантаження і видалення
- [x] `package.json` пакета має `exports` на `./assets/*`; web, admin і mobile можуть залежати від `@fade/brand-assets` без копії файлів
- [x] `pnpm docs:validate` зелений

## Risks

- [ ] **Три бакати з T-001a створено приватними** (`mc anonymous set none`) — публічний бакет треба Create окремо й окремо задокументувати, хто читає
- [ ] **Роздвоєння правди `brand/` ↔ пакет** — лікується provenance + checksum + обов'язковим `verify` у CI
- [ ] **on-dark без on-milk**: варіант «лише темний» непридатний — або обома, або жодного
- [ ] **Ключ об'єкта в S3** повинен бути недовгим і без префіксу дат (гарячі файли) — інакше застрягнуть бакети з мільйонами ключів (ADR 0019)
- [ ] **`alt` зроблено optional** («лого не читають») — зламає скринрідер і WCAG; обов'язковий
