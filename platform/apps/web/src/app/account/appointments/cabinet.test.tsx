// «Мої візити» (GET /booking/appointments): сторінка не мав жодного тесту.
// Тут — розкладка за статусами (CABINET_STATUS дзеркалить бекенд) і те, що
// мертвий UI more не повертається. Стани екрана — у cabinet.states.test.tsx
// (LOC-гейт ADR 0019), референс — у reference-thumbnail.test.tsx.
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAppointments } from '@/lib/api/appointments';
import { useAuth } from '../../components/auth/AuthProvider';
import { getReferencePhotoUrl } from '../../booking/referencePhotoApi';
import AppointmentsPage from './page';
import { makeVisit } from './test-fixtures';

jest.mock('@/lib/api/appointments', () => ({
  ...jest.requireActual('@/lib/api/appointments'),
  getAppointments: jest.fn(),
}));
jest.mock('../../booking/referencePhotoApi', () => ({ getReferencePhotoUrl: jest.fn() }));
jest.mock('../../components/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const getAppointmentsMock = getAppointments as jest.MockedFunction<typeof getAppointments>;

/** Секція кабінету за заголовком — інакше перевіряти треба весь текст сторінки. */
function section(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name });
  const parent = heading.parentElement;
  if (!parent) throw new Error(`Секція «${name}» не знайдена`);
  return parent;
}

beforeEach(() => {
  getAppointmentsMock.mockReset();
  jest.mocked(getReferencePhotoUrl).mockReset();
  jest.mocked(getReferencePhotoUrl).mockResolvedValue(null);
  (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
    isLoading: false,
    refreshUser: jest.fn(),
  } as never);
});

describe('«Мої візити» — розкладка за статусами', () => {
  it('upcoming і confirmed — у «Майбутні», completed і cancelled — у «Минулі»', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'a', serviceName: 'Стрижка a', status: 'upcoming' }),
      makeVisit({ id: 'b', serviceName: 'Стрижка b', status: 'confirmed' }),
      makeVisit({ id: 'c', serviceName: 'Стрижка c', status: 'completed' }),
      makeVisit({ id: 'd', serviceName: 'Стрижка d', status: 'cancelled' }),
    ]);
    render(<AppointmentsPage />);
    await screen.findByRole('heading', { name: 'Майбутні' });

    expect(section('Майбутні').textContent).toContain('Стрижка b');
    expect(section('Майбутні').textContent).not.toContain('Стрижка c');
    expect(section('Минулі').textContent).toContain('Стрижка d');
    expect(section('Минулі').textContent).not.toContain('Стрижка a');
  });

  it('бейджі статусів читаються українською', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'a', status: 'confirmed' }),
      makeVisit({ id: 'b', status: 'completed' }),
    ]);
    render(<AppointmentsPage />);
    // Ті самі мітки є в option фільтра — звіряємо саме бейджі (span у картці).
    expect(await screen.findByText('Підтверджено', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Завершено', { selector: 'span' })).toBeInTheDocument();
  });

  it('дії є лише в активних візитах — минулі лишаються переглядом', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'a', status: 'upcoming' }),
      makeVisit({ id: 'b', status: 'completed' }),
    ]);
    render(<AppointmentsPage />);
    await screen.findByRole('heading', { name: 'Майбутні' });
    expect(screen.getAllByRole('button', { name: 'Перенести' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Скасувати' })).toHaveLength(1);
  });

  // Регресія: UI мав оплату депозиту й відгук, але маршрутів pay-deposit і
  // review не існувало — кнопки були недосяжними, а «Залишити відгук» показувався
  // завжди, бо reviewSubmitted приходив як undefined.
  it('немає кнопок оплати депозиту й відгуку', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'a', status: 'upcoming' }),
      makeVisit({ id: 'b', status: 'completed' }),
    ]);
    render(<AppointmentsPage />);
    await screen.findByRole('heading', { name: 'Майбутні' });
    expect(screen.queryByRole('button', { name: 'Оплатити депозит' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Залишити відгук' })).toBeNull();
  });

  it('коректно обробляє порожній список візитів', async () => {
    getAppointmentsMock.mockResolvedValue([]);
    render(<AppointmentsPage />);
    await screen.findByRole('heading', { name: 'Майбутні' });
    expect(screen.getByRole('heading', { name: 'Майбутні' })).toBeInTheDocument();
  });
});
