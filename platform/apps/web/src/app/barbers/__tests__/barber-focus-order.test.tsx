import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarbersClient } from '../BarbersClient';
import type { StudioRoster } from '@/lib/api/studio-directory';

// T-4870a: на /barbers клавіатура йде ланцюжком, полем пошуку, чипами й аж
// потім картками. Ланцюжок уже має ланку «Головна», тож другий підпис тієї ж
// дії («← На головну») не потрібен — він лише повторює назву.

const studios: StudioRoster[] = [
  {
    code: 'KYI-01',
    name: 'Fade Kyiv',
    city: 'Київ',
    barbers: [
      {
        id: 'barber-1',
        userId: 'user-1',
        slug: 'alex',
        name: 'Олександр',
        role: 'Барбер',
        active: true,
        photoUrl: null,
      },
    ],
  },
];

describe('Порядок фокуса в довіднику (T-4870a)', () => {
  it('walks the breadcrumb, the find field, the chips and then the cards', async () => {
    const user = userEvent.setup();
    render(<BarbersClient studios={studios} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Головна' }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Знайти майстра' }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Усі майстри (1)' }));

    // Після першого чипа лишаються ще три, а далі — перша картка.
    for (let chip = 0; chip < 4; chip += 1) {
      await user.tab();
    }
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Олександр' }));
  });

  it('does not repeat the breadcrumb with a second home label', () => {
    render(<BarbersClient studios={studios} />);
    expect(screen.queryByText(/На головну/)).toBeNull();
  });
});
