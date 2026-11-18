import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountShell } from '../AccountShell';
import { useAuth } from '@/app/components/auth/AuthProvider';

const mockPush = jest.fn();
let mockCurrentPath = '/account/devices';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockCurrentPath,
}));

jest.mock('@/app/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

function signedOut() {
  mockUseAuth.mockReturnValue({ user: null, isLoading: false, logout: jest.fn() });
}

function signedIn() {
  mockUseAuth.mockReturnValue({
    user: { name: 'Олексій', phone: '+380671112233' },
    isLoading: false,
    logout: jest.fn(),
  });
}

describe('AccountShell guard', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockCurrentPath = '/account/devices';
  });

  it('keeps the cabinet path in the login URL when signed out', () => {
    signedOut();
    render(<AccountShell>вміст</AccountShell>);

    expect(mockPush).toHaveBeenCalledWith('/login?next=%2Faccount%2Fdevices');
  });

  it.each(['/account', '/account/appointments', '/account/referrals'])(
    'keeps %s as the return path',
    (path) => {
      mockCurrentPath = path;
      signedOut();
      render(<AccountShell>вміст</AccountShell>);

      expect(mockPush).toHaveBeenCalledWith(`/login?next=${encodeURIComponent(path)}`);
    }
  );

  it('does not redirect while the session is still loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true, logout: jest.fn() });
    render(<AccountShell>вміст</AccountShell>);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect a signed-in client', () => {
    signedIn();
    render(<AccountShell>вміст</AccountShell>);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Вийти' })).toBeInTheDocument();
  });
});
