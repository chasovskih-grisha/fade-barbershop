import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  getAppointments,
  setAppointmentReference,
  rescheduleAppointment,
  cancelAppointment,
} from '../../../../lib/api/appointments';
import { makeVisit } from './fixtures';
import { MyVisitsScreen } from './page';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../../../lib/api/appointments', () => ({
  getAppointments: jest.fn(),
  setAppointmentReference: jest.fn(),
  rescheduleAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, code: number) {
      super(message);
      this.name = 'ApiError';
      this.status = code;
    }
  },
}));
jest.mock('../../../../lib/api/reference-photo', () => ({
  getReferencePhotoUrl: jest.fn(async () => null),
  uploadReferencePhoto: jest.fn(),
}));
jest.mock('../../../../lib/reference-picker', () => ({ pickReferencePhoto: jest.fn() }));

const mockedList = getAppointments as jest.MockedFunction<typeof getAppointments>;
const mockedSave = setAppointmentReference as jest.MockedFunction<typeof setAppointmentReference>;
const mockedReschedule = rescheduleAppointment as jest.MockedFunction<typeof rescheduleAppointment>;
const mockedCancel = cancelAppointment as jest.MockedFunction<typeof cancelAppointment>;

const MockApiError = (
  jest.requireMock('../../../../lib/api/appointments') as {
    ApiError: new (message: string, code: number) => Error;
  }
).ApiError;
const EDIT_LABEL = 'Редагувати референс і коментар';

beforeEach(() => {
  mockedList.mockReset();
  mockedSave.mockReset();
  mockedReschedule.mockReset();
  mockedCancel.mockReset();
  mockedList.mockResolvedValue([makeVisit()]);
  mockedSave.mockResolvedValue(undefined);
  mockedReschedule.mockResolvedValue(undefined);
  mockedCancel.mockResolvedValue(undefined);
});

describe('«Мої візити»: редагування референсу та дії з візитом (T-4740)', () => {
  it('зберігає коментар із картки й перечитує список', async () => {
    render(<MyVisitsScreen />);

    fireEvent.press(await screen.findByRole('button', { name: EDIT_LABEL }));
    fireEvent.changeText(screen.getByLabelText('Коментар майстру'), 'зняти на 2 мм');
    fireEvent.press(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() =>
      expect(mockedSave).toHaveBeenCalledWith('apt-1', { comment: 'зняти на 2 мм' })
    );
    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(2));
    expect(screen.queryByLabelText('Коментар майстру')).toBeNull();
  });

  it('переносить майбутній візит', async () => {
    render(<MyVisitsScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Перенести' }));
    expect(screen.getByTestId('reschedule-modal')).toBeTruthy();

    fireEvent.press(screen.getByTestId('reschedule-confirm-button'));

    await waitFor(() =>
      expect(mockedReschedule).toHaveBeenCalledWith('apt-1', {
        date: '2030-05-12',
        end: '10:45',
        start: '10:00',
      })
    );
    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(2));
  });

  it('скасовує майбутній візит', async () => {
    render(<MyVisitsScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Скасувати' }));
    expect(screen.getByTestId('cancel-modal')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Скасувати запис' }));

    await waitFor(() => expect(mockedCancel).toHaveBeenCalledWith('apt-1'));
    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(2));
  });

  it('помилку замка (409) показує в картці, а не ковтає', async () => {
    mockedSave.mockRejectedValue(new MockApiError('Reference is locked', 409));
    render(<MyVisitsScreen />);

    fireEvent.press(await screen.findByRole('button', { name: EDIT_LABEL }));
    fireEvent.changeText(screen.getByLabelText('Коментар майстру'), 'пізно');
    fireEvent.press(screen.getByRole('button', { name: 'Зберегти' }));

    expect(await screen.findByText(/уже підтвердив/)).toBeTruthy();
    expect(screen.getByLabelText('Коментар майстру')).toBeTruthy();
  });
});
