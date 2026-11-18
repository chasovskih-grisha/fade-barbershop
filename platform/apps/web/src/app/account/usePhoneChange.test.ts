import { act, renderHook } from '@testing-library/react';
import { CODE_INVALID_TEXT, PHONE_TAKEN_TEXT, usePhoneChange } from './usePhoneChange';

const ok = (body: unknown = {}) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown) => ({ ok: false, status, json: async () => body });
const submit = () => ({ preventDefault: () => {} }) as React.FormEvent;

const OTHER_CLIENT_NAME = 'Інший Клієнт';

function setup() {
  const onSuccess = jest.fn();
  const hook = renderHook(() => usePhoneChange(onSuccess));
  act(() => hook.result.current.open());
  act(() => hook.result.current.setPhone('380991234567'));
  return { ...hook, onSuccess };
}

describe('usePhoneChange (T-4720b)', () => {
  afterEach(() => jest.clearAllMocks());

  it('keeps the wrong code on the code step', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(ok({ retryAfterSec: 60 }))
      .mockResolvedValueOnce(fail(400, { code: 'OTP_INVALID', message: 'bad code' }));
    const { result, onSuccess } = setup();
    await act(() => result.current.submitNumber(submit()));
    expect(result.current.step).toBe('code');
    await act(() => result.current.submitCode(submit()));
    expect(result.current.step).toBe('code');
    expect(result.current.error).toBe(CODE_INVALID_TEXT);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('refuses a number owned by someone else without naming them', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(ok({ retryAfterSec: 60 }))
      .mockResolvedValueOnce(fail(409, { code: 'PHONE_TAKEN', message: OTHER_CLIENT_NAME }));
    const { result, onSuccess } = setup();
    await act(() => result.current.submitNumber(submit()));
    await act(() => result.current.submitCode(submit()));
    expect(result.current.error).toBe(PHONE_TAKEN_TEXT);
    expect(result.current.error).not.toContain(OTHER_CLIENT_NAME);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('ends the session on success and never touches another OTP purpose', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ ok: true, phone: '+380991234567' }));
    const { result, onSuccess } = setup();
    await act(() => result.current.submitNumber(submit()));
    act(() => result.current.setCode('123456'));
    await act(() => result.current.submitCode(submit()));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url).toBe('/identity/phone/change/verify');
    expect(init.body).toBe(JSON.stringify({ phone: '+380991234567', code: '123456' }));
  });
});
