// T-4730c: картка дня народження застосунку. Дата, збережена на сайті,
// показується тут; «Очистити» прибирає її і для сайту (той самий PATCH).
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { updateProfileBirthday } from '@/lib/api/identity';
import { BirthdayCard } from './birthday-card';

jest.mock('@/lib/api/identity', () => ({
  updateProfileBirthday: jest.fn(),
}));

const update = updateProfileBirthday as jest.MockedFunction<typeof updateProfileBirthday>;

describe('BirthdayCard — день народження (T-4730c)', () => {
  beforeEach(() => update.mockReset());

  it('показує дату, збережену на сайті', () => {
    const { getByText } = render(<BirthdayCard initial={{ day: 12, month: 11 }} />);
    expect(getByText('12 листопада')).toBeTruthy();
  });

  it('порожнє значення показує запрошення, а не вигадану дату', () => {
    const { getByText } = render(<BirthdayCard initial={null} />);
    expect(getByText('Дату не вказано')).toBeTruthy();
  });

  it('«Очистити» прибирає дату через PATCH (null)', async () => {
    update.mockResolvedValue(null);
    const { getByTestId } = render(<BirthdayCard initial={{ day: 12, month: 11 }} />);

    fireEvent.press(getByTestId('birth-clear'));

    await waitFor(() => expect(update).toHaveBeenCalledWith(null));
  });

  it('вибір дня й місяця зберігається без року', async () => {
    update.mockResolvedValue({ day: 5, month: 3 });
    const { getByTestId, getByText } = render(<BirthdayCard initial={null} />);

    fireEvent.press(getByTestId('birth-day-5'));
    fireEvent.press(getByTestId('birth-month-3'));
    fireEvent.press(getByTestId('birth-save'));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ day: 5, month: 3 }));
    expect(getByText('5 березня')).toBeTruthy();
  });

  it('скорочений місяць зменшує неможливий день (31 → лютий → 29)', async () => {
    update.mockResolvedValue({ day: 29, month: 2 });
    const { getByTestId } = render(<BirthdayCard initial={null} />);

    fireEvent.press(getByTestId('birth-day-31'));
    fireEvent.press(getByTestId('birth-month-2'));
    fireEvent.press(getByTestId('birth-save'));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ day: 29, month: 2 }));
  });
});
