import { render, screen } from '@testing-library/react';
import BarbersPage, { metadata } from '../page';
import * as directoryApi from '@/lib/api/studio-directory';

// T-4854: шапка `/barbers` не вигадує статистику мережі. Три картки «5+ років»,
// «100%» і «Прямий запис» зникають, а опис маршруту перестає обіцяти вільні
// вікна, портфоліо й ціни, яких у записі немає.

jest.mock('@/lib/api/studio-directory');

const barber = {
  id: 'barber-1',
  userId: 'user-1',
  slug: 'alex',
  name: 'Олександр',
  role: 'barber',
  active: true,
  photoUrl: null,
};

describe('BarbersPage — шапка без вигаданих цифр (T-4854)', () => {
  it('не показує «5+ років», «100%» чи «Прямий запис»', async () => {
    jest.spyOn(directoryApi, 'getBarbersByStudio').mockResolvedValueOnce({
      state: 'ok',
      data: [{ code: 'KYI-01', name: 'Fade Kyiv', city: 'Київ', barbers: [barber] }],
    });
    const { container } = render(await BarbersPage());

    expect(screen.getByText('Архітектори вашого стилю')).toBeInTheDocument();
    const text = container.textContent ?? '';
    expect(text).not.toContain('5+ років');
    expect(text).not.toContain('100%');
    expect(text).not.toContain('Прямий запис');
    expect(text).not.toContain('Середній досвід роботи');
    expect(text).not.toContain('багаторічним досвідом');
    expect(text).toContain('Майстри, які зараз працюють у студії: 1');
  });

  it('опис маршруту не обіцяє вільних вікон, портфоліо чи цін', () => {
    const description = String(metadata.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description).not.toMatch(/вільн/i);
    expect(description).not.toMatch(/цін/i);
    expect(description).not.toMatch(/портфоліо/i);
  });
});
