import { render, screen, within } from '@testing-library/react';
import BarbersPage from '../page';
import * as directoryApi from '@/lib/api/studio-directory';

// T-4852a: сторінка довідника показує кожну студію своїм блоком, а людина з
// двома призначеннями — одна картка, яка називає обидві студії.

jest.mock('@/lib/api/studio-directory');

const studio = (code: string, name: string) => ({ code, name });

const barber = (id: string, name: string, studios: { code: string; name: string }[]) => ({
  id,
  userId: id,
  slug: id,
  name,
  role: 'Майстер-барбер',
  active: true,
  photoUrl: null,
  studios,
});

const studios = [
  {
    code: 'KYI-01',
    name: 'Fade Kyiv',
    city: 'Київ',
    barbers: [
      barber('taras', 'Тарас', [studio('KYI-01', 'Fade Kyiv'), studio('LVI-01', 'Fade Lviv')]),
      barber('ivan', 'Іван', [studio('KYI-01', 'Fade Kyiv')]),
    ],
  },
  { code: 'LVI-01', name: 'Fade Lviv', city: 'Львів', barbers: [barber('oleg', 'Олег', [studio('LVI-01', 'Fade Lviv')])] },
];

describe('BarbersPage — довідник по студіях (T-4852a)', () => {
  it('renders one section per studio and one card for the shared barber', async () => {
    (directoryApi.getBarbersByStudio as jest.Mock).mockResolvedValueOnce({ state: 'ok', data: studios });

    render(await BarbersPage());

    expect(screen.getByRole('heading', { name: /Fade Kyiv/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Fade Lviv/ })).toBeInTheDocument();
    expect(screen.getByText('Київ')).toBeInTheDocument();
    expect(screen.getByText('Львів')).toBeInTheDocument();

    // Тарас — одна картка, і вона називає обидві студії.
    expect(screen.getAllByRole('link', { name: 'Тарас' })).toHaveLength(1);
    expect(screen.getByText('Fade Kyiv · Fade Lviv')).toBeInTheDocument();

    const lviv = screen.getByRole('region', { name: /Fade Lviv/ });
    expect(within(lviv).queryByRole('link', { name: 'Тарас' })).toBeNull();
    expect(within(lviv).getByRole('link', { name: 'Олег' })).toBeInTheDocument();
    expect(screen.getByText(/Майстри, які зараз працюють у мережі: 3/)).toBeInTheDocument();
  });
});
