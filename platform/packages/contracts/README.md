# @fade/contracts

Контракти між API і клієнтами.

- `openapi/` — HTTP API (коли з’явиться перший endpoint)
- `events/` — інтеграційні події між контекстами (і для майбутніх воркерів)

Клієнти (web, admin, mobile) залежать від контрактів, не від внутрішньої моделі домену.

## Ідентифікатори — завжди UUID-рядок

ADR 0021: кожен `id` у контракті — `string` у форматі UUID і **ніколи** не число.
Домен генерує UUID v7; транспорт не залежить від версії, тож `Uuid` з `src/uuid.ts`
приймає v1–v8 (dev-фікстури — v4, детерміновані сід-ключі — v5).

```ts
import { isUuid, uuidSchema, type Uuid } from '@fade/contracts';

const session: { id: Uuid; phone: string } = {
  id: '0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13', // v7 із домену
  phone: '+380501112233',
};

isUuid(session.id); // true
uuidSchema.parse(session.id); // '0192f1a4-…' — або ZodError на 'loc-1'
```

`uuidV7Schema` — для місць, де потрібен саме час-упорядкований id (курсори,
сортування за створенням). Для більшості входів достатньо `uuidSchema`.
