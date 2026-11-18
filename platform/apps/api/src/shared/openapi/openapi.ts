// OpenAPI-документ API (T-4607). Джерело правди — декоратори контролерів:
// специфікація генерується з коду, а не підтримується руками, тож не дрейфує.
// Документ — вхід для генерації SDK (T-4569), тому operationId лишаємо
// дефолтним (`Controller_method`) — він стабільний між прогонами.
//
// Маршрути: /docs — Swagger UI, /docs.json — сира специфікація;
// /openapi і /openapi.json — аліаси для тулінгу, що шукає спеку за
// конвенційним іменем. Префікс /api не потрібен: у API немає global prefix
// (маршрути кореневі: /booking/*, /admin/*, /identity/*), а фронтенди
// проксують лише свої префікси (/admin/*, /identity/*, /booking/* тощо),
// тож /docs ні з чим не перетинається.
//
// Схеми безпеки оголошуються, але глобальний security НЕ ставиться: більшість
// ендпоінтів публічні (booking, content), тож вимога автентифікації на
// кожному з них була б брехнею. Точкові позначки @ApiCookieAuth/
// @ApiBearerAuth на захищених хендлерах — окремий крок (тут лише схеми).

import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Імена схем безпеки — використовуються в @ApiSecurity на хендлерах. */
export const SECURITY_SCHEME_COOKIE = 'sessionCookie';
export const SECURITY_SCHEME_BEARER = 'bearerAuth';

/** Групи, які контролери вже позначають через @ApiTags. */
const TAGS: readonly { name: string; description: string }[] = [
  { name: 'booking', description: 'Публічний флоу запису: локації, послуги, слоти, референси' },
  { name: 'appointments', description: 'Візити клієнта: скасування, перенесення, референс' },
  { name: 'admin-bookings', description: 'Записи, створені адміністратором (телефон/візит)' },
  {
    name: 'admin-appointments',
    description: 'Життєвий цикл візиту: підтвердження, старт, завершення',
  },
  { name: 'admin-calendar', description: 'Сітка візитів день/тиждень з фільтрами' },
  { name: 'admin-live', description: 'Живий потік подій візитів (SSE)' },
  {
    name: 'admin-settings',
    description: 'Налаштування без деплою: геокодер, нагадування, підтвердження',
  },
  { name: 'haircut-ai', description: 'AI-генерація зачісок і керування фото клієнта' },
];

/** Точки монтування документа: UI + сира специфікація на кожній. */
export const OPENAPI_MOUNTS: readonly { path: string; jsonDocumentUrl: string }[] = [
  { path: 'docs', jsonDocumentUrl: 'docs.json' },
  { path: 'openapi', jsonDocumentUrl: 'openapi.json' },
];

/**
 * Конфіг документа (чиста функція — без застосунку, тому тестується напряму).
 * `sessionCookieName` передається з композиційного кореня, щоб shared-шар не
 * залежав від identity.
 */
export function buildOpenApiConfig(sessionCookieName: string): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('Fade Platform API')
    .setDescription(
      'HTTP + realtime API платформи Fade. Специфікація генерується з декораторів ' +
        'контролерів — джерело правди в коді, не в цьому документі.'
    )
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .addServer('http://localhost:13000', 'Локальний dev (pnpm dev)')
    .addCookieAuth(
      sessionCookieName,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'HttpOnly-сесія (admin і web-канал). Токен ставиться Set-Cookie після login/OTP.',
      },
      SECURITY_SCHEME_COOKIE
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        description: 'Access-токен mobile-клієнта (пара access + refresh з OTP-verify).',
      },
      SECURITY_SCHEME_BEARER
    );

  for (const tag of TAGS) builder.addTag(tag.name, tag.description);
  return builder.build();
}

/**
 * Монтує документ і Swagger UI. Викликати до `app.listen()`.
 * Документ будується один раз і перевикористовується на всіх точках монтування.
 */
export function setupOpenApi(app: INestApplication, sessionCookieName: string): void {
  const document = SwaggerModule.createDocument(app, buildOpenApiConfig(sessionCookieName));
  for (const mount of OPENAPI_MOUNTS) {
    SwaggerModule.setup(mount.path, app, document, {
      jsonDocumentUrl: mount.jsonDocumentUrl,
      customSiteTitle: 'Fade Platform API',
    });
  }
}
