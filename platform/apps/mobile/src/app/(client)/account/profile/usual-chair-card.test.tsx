// T-4725c: картка звичної локації і барбера в застосунку. Той самий PATCH, що й
// на сайті: вибір із сайту видно тут, «Не обрано» лишається порожнім, а
// зниклий id показується як «Більше не доступно».
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { updateProfileUsualChair } from '@/lib/api/identity';
import { fetchBarbers } from '@/lib/api/barbers';
import { fetchLocations } from '@/lib/api/locations';
import { UsualChairCard } from './usual-chair-card';
import { EMPTY_CHOICE_LABEL, UNAVAILABLE_CHOICE_LABEL } from './usual-chair';

jest.mock('@/lib/api/identity', () => ({
  updateProfileUsualChair: jest.fn(),
}));
jest.mock('@/lib/api/barbers', () => ({
  fetchBarbers: jest.fn(),
  listedBarbers: (rows: unknown[]) => rows,
}));
jest.mock('@/lib/api/locations', () => ({
  fetchLocations: jest.fn(),
}));

const update = updateProfileUsualChair as jest.MockedFunction<typeof updateProfileUsualChair>;
const locations = fetchLocations as jest.MockedFunction<typeof fetchLocations>;
const barbers = fetchBarbers as jest.MockedFunction<typeof fetchBarbers>;

const BARBER_1 = '018f2b9c-2222-7aaa-8bbb-000000000001';
const CLOSED = '018f2b9c-1111-7aaa-8bbb-00000000000f';

const PODIL = '018f2b9c-1111-7aaa-8bbb-000000000001';
const PECHERSK = '018f2b9c-1111-7aaa-8bbb-000000000002';
const LOCATION_ROWS = [
  { id: PODIL, name: 'Поділ', active: true },
  { id: PECHERSK, name: 'Печерськ', active: true },
];

describe('UsualChairCard — звичне місце (T-4725c)', () => {
  beforeEach(() => {
    update.mockReset();
    locations.mockReset();
    barbers.mockReset();
    locations.mockResolvedValue(LOCATION_ROWS as unknown as Awaited<ReturnType<typeof fetchLocations>>);
    barbers.mockResolvedValue([{ id: BARBER_1, name: 'Ігор' }] as unknown as Awaited<
      ReturnType<typeof fetchBarbers>
    >);
  });

  it('порожній вибір показує «Не обрано» і нічого не зберігає без дії', async () => {
    const { getByTestId, getAllByText } = render(<UsualChairCard initial={null} />);

    await waitFor(() => expect(getByTestId('usual-location-none')).toBeTruthy());
    expect(getAllByText(EMPTY_CHOICE_LABEL).length).toBeGreaterThanOrEqual(2);
    expect(getByTestId('usual-save').props.accessibilityState?.disabled).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });

  it('показує вибір, збережений на сайті', async () => {
    const locationId = PODIL;
    const { getByTestId } = render(
      <UsualChairCard initial={{ locationId, barberId: BARBER_1 }} />
    );

    await waitFor(() =>
      expect(getByTestId(`usual-barber-${BARBER_1}`).props.accessibilityState?.selected).toBe(true)
    );
    expect(getByTestId(`usual-location-${locationId}`).props.accessibilityState?.selected).toBe(
      true
    );
  });

  it('«Не обрано» зберігається порожнім, без підстановки першої локації', async () => {
    update.mockResolvedValue({ locationId: null, barberId: null });
    const { getByTestId } = render(
      <UsualChairCard initial={{ locationId: PODIL, barberId: BARBER_1 }} />
    );
    // Довідник завантажується: до цього кнопка збереження ще заблокована.
    await waitFor(() => expect(getByTestId('usual-location-none')).toBeTruthy());
    await waitFor(() => expect(getByTestId(`usual-location-${PODIL}`)).toBeTruthy());

    fireEvent.press(getByTestId('usual-location-none'));
    fireEvent.press(getByTestId('usual-save'));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ locationId: null, barberId: null }));
  });

  it('зниклий id показує «Більше не доступно» і очищається', async () => {
    const { getByTestId } = render(
      <UsualChairCard initial={{ locationId: CLOSED, barberId: null }} />
    );

    await waitFor(() =>
      expect(getByTestId('usual-location-unavailable').props.children).toBe(
        UNAVAILABLE_CHOICE_LABEL
      )
    );
    fireEvent.press(getByTestId('usual-clear'));
    fireEvent.press(getByTestId('usual-save'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ locationId: null, barberId: null })
    );
    // Після збереження порожнеча — це вибір клієнта, а не «більше не доступно»:
    // кнопка збереження знову неактивна, бо змінювати більше нічого.
    await waitFor(() => expect(getByTestId('usual-save').props.accessibilityState?.disabled).toBe(true));
  });
});
