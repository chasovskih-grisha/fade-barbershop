export function mockLoginRoutes(
  meStatus: number,
  logins: { status: number; body?: object } | null
) {
  const loginsRoute = logins ?? { status: 200, body: { entries: [] } };
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.startsWith('/admin/auth/me')) {
      return Promise.resolve({
        ok: meStatus < 400,
        status: meStatus,
        json: async () => ({ id: 'admin-1' }),
      });
    }
    if (url.includes('/admin/admins/admin-1/logins') || url.includes('/admin/admins/logins')) {
      return Promise.resolve({
        ok: loginsRoute.status < 400,
        status: loginsRoute.status,
        json: async () => loginsRoute.body ?? {},
      });
    }
    return Promise.reject(new Error('unexpected fetch: ' + url));
  });
}
