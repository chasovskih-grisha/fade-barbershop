# OpenAPI

Специфікація Identity (`identity.yaml`) — джерело істини для HTTP-поверхні
`/identity/*` і `/admin/*`.

## Ідентифікатори (T-4300d, ADR 0021)

Усі `id` / `userId` / id у масивах описано компонентом `Uuid`:
`type: string`, `format: uuid`, `pattern` з версіями 1–8. Path-параметри
(`/admin/admins/{id}/…`) посилаються на `components.parameters.AdminId`,
тож «числовий id» у специфікації неможливий — клієнтські генератори одразу
отримають `string`.

Приклад відповіді `GET /identity/profile`:

```json
{
  "id": "0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13",
  "userId": "0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13",
  "phone": "+380501112233",
  "preferences": [{ "id": "0192f1a4-7c41-7f0a-8d2e-5b7c9a1e3f60", "text": "без парфумів" }]
}
```

Runtime-валідація — `uuidSchema` / `uuidV7Schema` з `@fade/contracts`.
