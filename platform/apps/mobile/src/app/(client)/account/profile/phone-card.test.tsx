import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PhoneCard } from './phone-card';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const PHONE = '+380671112233';

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  (router.replace as jest.Mock).mockReset();
});

describe('PhoneCard — зміна номера з профілю застосунку (T-4720c)', () => {
  it('показує номер із identity без поля редагування', () => {
    const { getByText, queryByTestId } = render(<PhoneCard phone={PHONE} />);

    expect(getByText(PHONE)).toBeTruthy();
    expect(queryByTestId('profile-phone-new-input')).toBeNull();
  });

  it('не запитує код для неповного номера', () => {
    const { getByTestId, getByText } = render(<PhoneCard phone={PHONE} />);

    fireEvent.press(getByTestId('profile-phone-change'));
    fireEvent.changeText(getByTestId('profile-phone-new-input'), '+380 67');
    fireEvent.press(getByText('Отримати код'));

    expect(getByText('Введіть номер у форматі +380 XX XXX XX XX')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('після коду веде на форму входу', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { retryAfterSec: 60 }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, phone: PHONE }));
    const { getByTestId, getByText } = render(<PhoneCard phone={PHONE} />);

    fireEvent.press(getByTestId('profile-phone-change'));
    fireEvent.changeText(getByTestId('profile-phone-new-input'), PHONE);
    fireEvent.press(getByText('Отримати код'));
    await waitFor(() => expect(getByTestId('profile-phone-code-input')).toBeTruthy());

    fireEvent.changeText(getByTestId('profile-phone-code-input'), '1111');
    fireEvent.press(getByText('Підтвердити'));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/identity/phone/change/verify'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('зайнятий номер показує ту саму відмову, що на сайті', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(409, { code: 'PHONE_TAKEN', message: 'Phone already taken' })
    );
    const { getByTestId, getByText } = render(<PhoneCard phone={PHONE} />);

    fireEvent.press(getByTestId('profile-phone-change'));
    fireEvent.changeText(getByTestId('profile-phone-new-input'), PHONE);
    fireEvent.press(getByText('Отримати код'));

    await waitFor(() =>
      expect(getByText('Цей номер уже використовується. Введіть інший.')).toBeTruthy()
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});
