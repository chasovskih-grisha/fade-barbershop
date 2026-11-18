import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BarbersPage from './page';

const mockPush = jest.fn();
const barber = {
  id: 'barber-1',
  name: 'Олена',
  phone: '+380501234567',
  active: true,
  selfSchedule: false,
};
const location = { id: 'location-1', name: 'FADE Поділ' };
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

// Сторінка-обгортка: сесію перевіряє AdminShell, BarbersManager фетчить
// /admin/barbers + /admin/locations напряму (без попереднього auth-запиту).
describe('BarbersPage', () => {
  let assigned = false;
  beforeEach(() => {
    mockPush.mockReset();
    assigned = false;
    global.fetch = jest.fn(async (input, init) => {
      const url = String(input);
      if (url === '/admin/barbers' && init?.method !== 'POST')
        return { ok: true, json: async () => [barber] } as Response;
      if (url === '/admin/locations') return { ok: true, json: async () => [location] } as Response;
      if (url.endsWith('/staff') && init?.method === 'POST') {
        assigned = true;
        return { ok: true, json: async () => ({ id: 'assignment-1' }) } as Response;
      }
      if (url.endsWith('/staff'))
        return {
          ok: true,
          json: async () => (assigned ? [{ id: 'assignment-1', barberId: barber.id }] : []),
        } as Response;
      return { ok: true, json: async () => ({ id: 'assignment-1' }) } as Response;
    });
  });

  it('loads staff from the API and creates a barber', async () => {
    render(<BarbersPage />);
    expect(await screen.findByText('Олена')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Ім’я'), { target: { value: 'Іван' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+380501112233' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Додати барбера' }));
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/admin/barbers',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('assigns a barber to a selected location', async () => {
    render(<BarbersPage />);
    await screen.findByText('Олена');
    fireEvent.click(screen.getByRole('button', { name: 'Графік і локації' }));
    fireEvent.change(screen.getByLabelText('Локація барбера barber-1'), {
      target: { value: location.id },
    });
    await screen.findByText('Не призначений');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Призначити' }));
    });
    await screen.findByText('Призначений');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/admin/locations/${location.id}/staff`,
        expect.objectContaining({ method: 'POST' })
      )
    );
  });
});
