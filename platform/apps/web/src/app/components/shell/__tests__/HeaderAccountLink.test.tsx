import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { HeaderAccountLink } from '../HeaderAccountLink';
import { MobileNav } from '../MobileNav';
import { useAuth } from '@/app/components/auth/AuthProvider';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// usePathname вирішує, чи додавати next (T-4715a).
let mockPathname: string | null = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));

jest.mock('@/app/components/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
const mockUseAuth = useAuth as jest.Mock;

const asSignedOut = () => mockUseAuth.mockReturnValue({ user: null, isLoading: false });
const asSignedIn = (name: string) =>
  mockUseAuth.mockReturnValue({ user: { name }, isLoading: false });

describe('контроль акаунта в шапці (T-4715b)', () => {
  beforeEach(() => {
    asSignedOut();
    mockPathname = '/';
  });

  it('вихід: іконка «Увійти» з next публічної сторінки', () => {
    mockPathname = '/locations/kyiv';
    render(<HeaderAccountLink />);
    expect(screen.getByRole('link', { name: 'Увійти' }).getAttribute('href')).toBe(
      '/login?next=%2Flocations%2Fkyiv'
    );
  });

  it.each(['/booking', '/account/appointments'])('вихід: %s — без next', (path) => {
    mockPathname = path;
    render(<HeaderAccountLink />);
    expect(screen.getByRole('link', { name: 'Увійти' }).getAttribute('href')).toBe('/login');
  });

  it('вхід: коло з ініціалами й доступним ім’ям веде в /account', () => {
    asSignedIn('Олексій Коваль');
    render(<HeaderAccountLink />);
    expect(screen.getByRole('link', { name: 'Кабінет, Олексій Коваль' }).getAttribute('href')).toBe(
      '/account'
    );
  });

  it('вхід без імені: доступне ім’я «Кабінет», без вигаданого з номера', () => {
    asSignedIn('');
    render(<HeaderAccountLink />);
    expect(screen.getByRole('link', { name: 'Кабінет' }).getAttribute('href')).toBe('/account');
  });

  it('мобільне меню повторює призначення контролю', () => {
    asSignedIn('Олексій Коваль');
    render(<MobileNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Відкрити меню' }));
    const nav = screen.getByRole('navigation', { name: 'Мобільна навігація' });
    expect(
      within(nav).getByRole('link', { name: 'Кабінет, Олексій Коваль' }).getAttribute('href')
    ).toBe('/account');
  });
});
