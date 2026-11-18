import { render, screen } from '@testing-library/react';
import LocationsPage from './page';

// Локації фетчаться сторінкою напряму (cookie йде автоматично; сесію
// перевіряє AdminShell у layout). Один дзвінок: /admin/locations.
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('LocationsPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders locations table', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'loc-1',
          code: 'KYY-01',
          name: 'FADE Сіті Лейк',
          address: 'пров. Ювілейний 2/1, с. Шевченкове',
        },
      ],
    });

    render(<LocationsPage />);
    expect(await screen.findByText('FADE Сіті Лейк')).toBeInTheDocument();
    expect(screen.getByText('пров. Ювілейний 2/1, с. Шевченкове')).toBeInTheDocument();
    expect(screen.getByText('KYY-01')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/admin/locations', { credentials: 'include' });
  });

  it('shows error state when load fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<LocationsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити локації');
  });
});
