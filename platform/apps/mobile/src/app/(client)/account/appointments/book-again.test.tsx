// T-4617b: завершений візит у застосунку має дію «Записатися знову», яка
// відкриває наявний флоу запису з чинними полями; майбутній візит її не має.
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AppointmentRow } from './list-item';
import { bookAgainNotice, bookAgainParams, staleFields } from './book-again';
import { makeVisit } from './fixtures';
import type { BookAgainIntent } from '../../../../lib/api/book-again';
import { getBookAgainIntent } from '../../../../lib/api/book-again';

jest.mock('../../../../lib/api/reference-photo', () => ({
  getReferencePhotoUrl: jest.fn(async () => null),
  uploadReferencePhoto: jest.fn(),
}));

jest.mock('../../../../lib/api/book-again', () => ({
  getBookAgainIntent: jest.fn(),
}));

const mockIntent = getBookAgainIntent as jest.MockedFunction<typeof getBookAgainIntent>;

const rowProps = {
  editing: false,
  busy: false,
  error: null,
  onEditReference: jest.fn(),
  onCancelEdit: jest.fn(),
  onSaveReference: jest.fn(),
};

const ref = (id: string, stale = false) => ({ id, name: id, stale });
const intent = (overrides: Partial<BookAgainIntent> = {}): BookAgainIntent => ({
  location: ref('loc-1'),
  service: ref('srv-1'),
  barber: ref('brb-1'),
  price: 600,
  ...overrides,
});

describe('book-again helpers (T-4617b)', () => {
  it('усі поля чинні — підставляються три ідентифікатори, повідомлення немає', () => {
    expect(bookAgainParams(intent())).toEqual({
      location: 'loc-1',
      service: 'srv-1',
      barber: 'brb-1',
    });
    expect(staleFields(intent())).toEqual([]);
    expect(bookAgainNotice(intent())).toBeNull();
  });

  it('нечинні поля не потрапляють у флоу, решта лишається', () => {
    const staleBarber = intent({ barber: ref('brb-1', true) });
    expect(bookAgainParams(staleBarber)).toEqual({ location: 'loc-1', service: 'srv-1' });
    expect(staleFields(staleBarber)).toEqual(['barber']);
    expect(bookAgainNotice(staleBarber)).toBe(
      'барбер більше не виконує цю послугу — оберіть заново'
    );

    const staleService = intent({ service: ref('srv-1', true) });
    expect(bookAgainParams(staleService)).toEqual({ location: 'loc-1', barber: 'brb-1' });
    expect(bookAgainNotice(staleService)).toBe('послуга більше не виконується — оберіть заново');
    expect(bookAgainParams(intent({ service: null, price: null }))).toEqual({
      location: 'loc-1',
      barber: 'brb-1',
    });
  });
});

describe('кнопка на завершеному візиті (T-4617b)', () => {
  beforeEach(() => mockIntent.mockReset());

  const renderVisit = (over: Parameters<typeof makeVisit>[0], onBookAgain = jest.fn()) =>
    render(<AppointmentRow {...rowProps} app={makeVisit(over)} onBookAgain={onBookAgain} />);

  it('завершений візит показує «Записатися знову» і відкриває флоу з чинними полями', async () => {
    mockIntent.mockResolvedValue(intent());
    const onBookAgain = jest.fn();
    renderVisit({ status: 'completed' }, onBookAgain);

    fireEvent.press(screen.getByText('Записатися знову'));

    await waitFor(() =>
      expect(onBookAgain).toHaveBeenCalledWith({
        location: 'loc-1',
        service: 'srv-1',
        barber: 'brb-1',
      })
    );
  });

  it('нечинний барбер показує речення і не підставляє його', async () => {
    mockIntent.mockResolvedValue(intent({ barber: ref('brb-1', true) }));
    const onBookAgain = jest.fn();
    renderVisit({ status: 'completed' }, onBookAgain);

    fireEvent.press(screen.getByText('Записатися знову'));

    await waitFor(() =>
      expect(onBookAgain).toHaveBeenCalledWith({ location: 'loc-1', service: 'srv-1' })
    );
    expect(screen.getByText('барбер більше не виконує цю послугу — оберіть заново')).toBeTruthy();
  });

  it('партія і майбутній візит кнопки не мають', () => {
    render(
      <AppointmentRow
        {...rowProps}
        app={makeVisit({ status: 'completed', canBookAgain: false })}
        onBookAgain={jest.fn()}
      />
    );
    expect(screen.queryByText('Записатися знову')).toBeNull();

    render(<AppointmentRow {...rowProps} app={makeVisit()} onBookAgain={jest.fn()} />);
    expect(screen.queryByText('Записатися знову')).toBeNull();
  });
});
