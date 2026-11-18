import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('../../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue(true),
    requestOtp: jest.fn().mockResolvedValue(true),
  }),
}));

describe('Login Screen Accessibility & WCAG Compliance (T-300a)', () => {
  it('announces step 1 on load without intercepting initial focus', () => {
    render(<LoginPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Крок 1 з 2: Введіть номер телефону');
    expect(document.activeElement).toBe(document.body);
  });

  it('announces step 2 and shifts focus when transitioning to OTP code step', async () => {
    render(<LoginPage />);

    const phoneInput = screen.getByLabelText(/Номер телефону/i);
    fireEvent.change(phoneInput, { target: { value: '+380991234567' } });

    const submitBtn = screen.getByRole('button', { name: /Отримати код/i });
    fireEvent.click(submitBtn);

    // After requestOtp succeeds, step switches to 2
    expect(await screen.findByRole('status')).toHaveTextContent(/Крок 2 з 2/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('login-step'));
    });
  });
});
