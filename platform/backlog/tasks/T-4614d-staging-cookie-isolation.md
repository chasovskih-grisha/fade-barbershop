# T-4614d · Cookie стейджа не на батьківському домені

- **Stage**: горизонтальна · **Tags**: backend, security · **Complexity**: junior · **Depends on**: T-4614, T-4531, ADR 0017
- **StoryPoints**: 3

## Блокер

Щойно стейдж і прод живуть під `fade.com.ua`, вони ділять клієнтську сесію.

`apps/api/src/identity/infrastructure/session-cookie.ts`:

- `DEFAULT_COOKIE_CONFIG.clientDomain` = `FADE_CLIENT_DOMAIN` або `.fade.com.ua`
- `buildSetCookie` завжди додає `Domain=${domain}` і для клієнта, і для адміна
- Адмінський дефолт — `admin.fade.com.ua`

`.com.ua` — публічний суфікс. Браузер віддасть cookie `Domain=.fade.com.ua` і на `stage.fade.com.ua`. Логін на стейджі стане логіном на проді.

Адмінська cookie з `Domain=admin.fade.com.ua` на `admin.stage.fade.com.ua` не приїде: логін адмінки на стейджі мовчки не тримає сесію, якщо домен не перевизначений.

T-011 описує прод-домен і не згадує стейдж. T-4531 вимагає host-only cookie, але коду під це none.

## What

Профіль стейджа ставить клієнтську і адмінську сесію host-only (без атрибута `Domain`). Прод лишає `Domain=.fade.com.ua` для клієнта і `admin.fade.com.ua` для адміна (ADR 0017).

## Done

- [x] При `stage` `Set-Cookie` клієнта і адміна без `Domain`
- [x] Прод-клієнт як і раніше на `.fade.com.ua`, прод-адмін на `admin.fade.com.ua`
- [x] Тест: cookie, видана для стейджа, не підходить хосту `fade.com.ua`; прод-cookie не потрібна для входу на стейдж

## Risks

- [x] **Один env на обидва стенди**: дефолт `.fade.com.ua` спрацює на стейджі, якщо профіль забули. Відсутній override має падати на старті стейджа, а не мовчки брати прод-домен. `cookieConfigFromEnv` кидає, якщо `NODE_ENV=stage` і обидва домени не задані порожніми рядками.

## Status

- Closed 2026-11-09. Stage profile is host-only; prod domains unchanged. Unit tests cover reachability and the startup refusal.
