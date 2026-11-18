import { DEFAULT_COOKIE_CONFIG, SESSION_COOKIE_NAME, buildClearCookie, buildSetCookie, cookieConfigFromEnv, cookieReachesHost } from './session-cookie';

const stageEnv = {
  NODE_ENV: 'stage',
  FADE_CLIENT_DOMAIN: '',
  FADE_ADMIN_DOMAIN: '',
  COOKIE_SECURE: 'true',
};

describe('session-cookie', () => {
  it('buildSetCookie for web uses client domain', () => {
    const cookie = buildSetCookie('abc', 'web', DEFAULT_COOKIE_CONFIG);
    expect(cookie).toContain(`Domain=${DEFAULT_COOKIE_CONFIG.clientDomain}`);
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=abc`);
  });

  it('buildSetCookie for admin uses admin domain', () => {
    const cookie = buildSetCookie('def', 'admin', DEFAULT_COOKIE_CONFIG);
    expect(cookie).toContain(`Domain=${DEFAULT_COOKIE_CONFIG.adminDomain}`);
  });

  it('buildClearCookie clears cookie for given channel', () => {
    const clear = buildClearCookie('web', DEFAULT_COOKIE_CONFIG);
    expect(clear).toContain('Max-Age=0');
    expect(clear).toContain(`Domain=${DEFAULT_COOKIE_CONFIG.clientDomain}`);
  });

  it('prod client stays on .fade.com.ua and prod admin on admin.fade.com.ua', () => {
    const config = cookieConfigFromEnv({ NODE_ENV: 'production' });
    expect(buildSetCookie('abc', 'web', config)).toContain('Domain=.fade.com.ua');
    expect(buildSetCookie('def', 'admin', config)).toContain('Domain=admin.fade.com.ua');
  });

  it('stage Set-Cookie for client and admin omits Domain', () => {
    const config = cookieConfigFromEnv(stageEnv);
    for (const channel of ['web', 'admin'] as const) {
      const set = buildSetCookie('tok', channel, config);
      const clear = buildClearCookie(channel, config);
      expect(set).not.toMatch(/Domain=/i);
      expect(clear).not.toMatch(/Domain=/i);
      expect(set).toContain('Secure');
    }
  });

  it('a stage cookie does not reach fade.com.ua; stage login does not need the prod cookie', () => {
    const stage = cookieConfigFromEnv(stageEnv);
    const prod = cookieConfigFromEnv({ NODE_ENV: 'production' });
    const stageCookie = buildSetCookie('stage-tok', 'web', stage);
    const prodCookie = buildSetCookie('prod-tok', 'web', prod);

    expect(cookieReachesHost(stageCookie, 'stage.fade.com.ua', 'fade.com.ua')).toBe(false);
    expect(cookieReachesHost(stageCookie, 'stage.fade.com.ua', 'stage.fade.com.ua')).toBe(true);
    expect(cookieReachesHost(prodCookie, 'fade.com.ua', 'stage.fade.com.ua')).toBe(true);
    expect(cookieReachesHost(stageCookie, 'api.stage.fade.com.ua', 'stage.fade.com.ua')).toBe(
      false
    );
  });

  it('stage refuses to start when the prod domain would be used', () => {
    expect(() => cookieConfigFromEnv({ NODE_ENV: 'stage' })).toThrow(/host-only/);
    expect(() =>
      cookieConfigFromEnv({
        NODE_ENV: 'stage',
        FADE_CLIENT_DOMAIN: '.fade.com.ua',
        FADE_ADMIN_DOMAIN: 'admin.fade.com.ua',
      })
    ).toThrow(/host-only/);
  });
});
