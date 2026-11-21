import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({ login: jest.fn(), requestOtp: jest.fn() }),
}));

describe('Login Screen Compliance (T-300)', () => {
  it('displays the personal data disclaimer and login rules', () => {
    render(<LoginPage />);
    expect(
      screen.getByText(/Уводячи номер, ви погоджуєтесь з політикою конфіденційності/i)
    ).toBeInTheDocument();
  });
});
