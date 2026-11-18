// Юніт-факти про конфіг OpenAPI без підйому застосунку (T-4607): дерево
// маршрутів перевіряється живою перевіркою (/docs.json), а тут фіксуємо те,
// що легко зламати рефакторингом — заголовок документа, сервер, схеми
// безпеки та адреси специфікації.
import { OPENAPI_MOUNTS, SECURITY_SCHEME_BEARER, SECURITY_SCHEME_COOKIE, buildOpenApiConfig } from './openapi';

describe('buildOpenApiConfig', () => {
  const config = buildOpenApiConfig('test-cookie');

  it('задає title і version — SwaggerModule.createDocument без них не працює', () => {
    expect(config.info.title).toBe('Fade Platform API');
    expect(config.info.version).toBeTruthy();
  });

  it('оголошує OpenAPI 3.x', () => {
    expect(config.openapi).toMatch(/^3\./);
  });

  it('додає локальний сервер із портом API', () => {
    expect(config.servers?.map((s) => s.url)).toContain('http://localhost:13000');
  });

  it('описує cookie- і bearer-схеми, беручи назву cookie як аргумент', () => {
    const schemes = config.components?.securitySchemes;
    expect(schemes?.[SECURITY_SCHEME_COOKIE]).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
      name: 'test-cookie',
    });
    expect(schemes?.[SECURITY_SCHEME_BEARER]).toMatchObject({ type: 'http', scheme: 'bearer' });
  });

  it('не нав’язує глобальний security — публічні ендпоінти лишаються доступними', () => {
    expect(config.security ?? []).toHaveLength(0);
  });
});

describe('OPENAPI_MOUNTS', () => {
  it('монтує /docs.json і /openapi.json — контракт T-4607', () => {
    expect(OPENAPI_MOUNTS).toEqual([
      { path: 'docs', jsonDocumentUrl: 'docs.json' },
      { path: 'openapi', jsonDocumentUrl: 'openapi.json' },
    ]);
  });
});
