import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountPage from './page';
import { EMPTY_SAVED_NOTE_MESSAGE } from './preferences';

// T-4731b: цитата — остання збережена нотатка, а не вміст textarea.

const mockUser: { preferences: string[] } = { preferences: [] };

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}));

const quote = () => screen.getByTestId('saved-note-quote');
const field = () => screen.getByLabelText(/Алергії, уподобання, побажання/i);

describe('AccountPage saved-note quote (T-4731b)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    mockUser.preferences = [];
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => jest.clearAllMocks());

  it('порожня збережена нотатка — порожнє речення', () => {
    render(<AccountPage />);
    expect(quote()).toHaveTextContent(EMPTY_SAVED_NOTE_MESSAGE);
  });

  it('показує завантажені рядки як цитату', () => {
    mockUser.preferences = ['алергія на ефірні олії', 'тиша'];
    render(<AccountPage />);
    expect(quote()).toHaveTextContent('алергія на ефірні олії тиша');
  });

  it('набір тексту не змінює цитату, успішне збереження — змінює', async () => {
    render(<AccountPage />);

    fireEvent.change(field(), { target: { value: 'не люблю розмов' } });
    expect(quote()).toHaveTextContent(EMPTY_SAVED_NOTE_MESSAGE);

    fireEvent.click(screen.getByRole('button', { name: 'Зберегти вподобання' }));
    await waitFor(() => expect(quote()).toHaveTextContent('не люблю розмов'));
  });
});
