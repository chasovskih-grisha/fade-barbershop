import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountLayout from '../../layout';
import ReferralsPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/account/referrals',
}));

jest.mock('@/app/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'u1', name: 'Test', phone: '+380626262626' },
    isLoading: false,
    logout: jest.fn(),
  })),
}));

describe('Реферальна програма (T-4457)', () => {
  it('відображає реферальний код, посилання та бонуси', async () => {
    render(<ReferralsPage />);

    expect(await screen.findByText('Реферальна програма')).toBeInTheDocument();
    expect(screen.getByText('FADE-VIP-7749')).toBeInTheDocument();
    expect(screen.getByText('300 ₴')).toBeInTheDocument();
    expect(screen.getByText('Друг #1')).toBeInTheDocument();
  });

  it('рендерить одну навігацію кабінету разом із layout', async () => {
    render(
      <AccountLayout>
        <ReferralsPage />
      </AccountLayout>
    );

    expect(await screen.findByText('Реферальна програма')).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Розділи кабінету' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Вийти' })).toHaveLength(1);
  });
});
