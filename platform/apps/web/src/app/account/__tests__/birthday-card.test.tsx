// T-4730b: картка дня народження кабінету. Збережене показується як
// «12 листопада» після перезавантаження, «Очистити» прибирає, і жодного
// запиту до кампанії/сповіщень збереження не робить.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountBirthdayCard } from '../AccountBirthdayCard';

function mockFetch(ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    json: async () => ({ birthday: null }),
  });
  global.fetch = fetchMock as never;
  return fetchMock;
}

describe('AccountBirthdayCard (T-4730b)', () => {
  afterEach(() => jest.clearAllMocks());

  it('показує збережену дату без року після перезавантаження', () => {
    mockFetch();
    render(<AccountBirthdayCard initial={{ day: 12, month: 11 }} token="t" />);

    expect(screen.getByText('12 листопада')).toBeInTheDocument();
  });

  it('порожнє значення показує запрошення, а не вигадану дату', () => {
    mockFetch();
    render(<AccountBirthdayCard initial={null} token="t" />);

    expect(screen.getByText('Дату не вказано')).toBeInTheDocument();
  });

  it('«Очистити» надсилає null і прибирає показану дату', async () => {
    const fetchMock = mockFetch();
    render(<AccountBirthdayCard initial={{ day: 12, month: 11 }} token="t" />);

    fireEvent.click(screen.getByRole('button', { name: 'Очистити' }));

    await waitFor(() => expect(screen.getByText('Дату не вказано')).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/account/birthday');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ birthday: null });
  });

  it('збереження робить один запит і не торкається кампаній чи сповіщень', async () => {
    const fetchMock = mockFetch();
    render(<AccountBirthdayCard initial={null} token="t" />);

    fireEvent.change(screen.getByLabelText('День'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Місяць'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти дату' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/account/birthday');
    expect(JSON.parse(init.body as string)).toEqual({ birthday: { day: 5, month: 3 } });
  });

  it('лютий не пропонує 31-ше число', () => {
    mockFetch();
    render(<AccountBirthdayCard initial={null} token="t" />);

    fireEvent.change(screen.getByLabelText('Місяць'), { target: { value: '2' } });
    const options = Array.from((screen.getByLabelText('День') as HTMLSelectElement).options).map(
      (o) => o.value
    );
    expect(options).toContain('29');
    expect(options).not.toContain('30');
    expect(options).not.toContain('31');
  });

  it('невдале збереження показує помилку і лишає збережену дату', async () => {
    mockFetch(false);
    render(<AccountBirthdayCard initial={{ day: 12, month: 11 }} token="t" />);

    fireEvent.click(screen.getByRole('button', { name: 'Очистити' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося зберегти'));
    expect(screen.getByText('12 листопада')).toBeInTheDocument();
  });
});
