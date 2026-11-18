# T-4300a · Генератор UUID v7 у shared kernel (4/30)

- **Stage**: M0 (phase 0) · **Tags**: backend, architecture · **Complexity**: middle · **Depends on**: T-001
- **StoryPoints**: 4

## What

Пакет `packages/shared-kernel` (або `packages/domain-shared`, якщо там): функція `uuidv7()` (client-side генерація, RFC 9562), тип `DomainId<T>` (brand-тип, щоб не переплутати `UserId` і `AppointmentId`), сериалізація в Prisma/HTTP як `string`. Юніт-Tests на монотонність у межах мілісекунди і формат.

## Why

Фундамент ADR 0021: усе інше (схеми, міграції, контракти) споживає цей генератор. Без нього кожен контекст вигадує свій ID — саме те, що політика забороняє.

## Sources

- ADR 0021 (UUID v7 як PK, заборона auto-increment)
- `packages/domain-shared/` README

## Done

- [x] `uuidv7()` реалізований і протестований (монотонність, формат RFC 9562)
- [x] Brand-типи `DomainId<T>` експортуються зі shared kernel
- [x] Documentation «як генерувати ID» в engineering-principles.md (короткий розділ)
- [x] Гейт: пакети, що генерують ID інакше, ловляться рев'ю (задача T-4300f — CI)

## Risks

- [ ] **Монотонність**: два UUID в одній мс — потрібен counter/entropy-біт (RFC-сумісно)
- [ ] **Проникнення бібліотек**: `crypto.randomUUID()` (v4) не повинен прослизати в домен
