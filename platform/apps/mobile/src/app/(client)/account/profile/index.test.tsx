// T-4728b: профіль застосунку малюється темою (`@fade/design-tokens`), а не
// сирими кольорами. Тест тримає обидві межі: екран рендериться зі своїми
// блоками і файл не містить hex-літералів та `accent.blue` як заливки.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react-native';
import { tokens } from '@fade/design-tokens';
import { ProfileScreen } from './index';

jest.mock('@/lib/notifications', () => ({
  usePush: () => ({
    token: 'ExponentPushToken[test]',
    permission: null,
    allowed: false,
    register: jest.fn(),
    revoke: jest.fn(),
    error: null,
  }),
}));

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

jest.mock('@/lib/api/client-sessions', () => ({
  getClientSessions: jest.fn().mockResolvedValue([]),
}));

describe('ProfileScreen — тема (T-4728)', () => {
  it('показує заголовок і блок сповіщень', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Профіль')).toBeTruthy();
    expect(getByText('Сповіщення')).toBeTruthy();
  });

  it('фон екрана береться з токена теми', () => {
    const { getByTestId } = render(<ProfileScreen />);
    const flattened = [getByTestId('profile-screen').props.style].flat(3);
    expect(flattened).toContainEqual(
      expect.objectContaining({ backgroundColor: tokens.color.surface.base.value })
    );
  });

  it('файли профілю не містять hex-літералів', () => {
    for (const file of ['index.tsx', 'profile-styles.ts']) {
      const source = readFileSync(join(__dirname, file), 'utf8');
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it('жоден контрол не використовує accent.blue як заливку', () => {
    const source = readFileSync(join(__dirname, 'profile-styles.ts'), 'utf8');
    expect(source).not.toMatch(/backgroundColor:\s*COLOR\.accent\.blue/);
  });
});

// T-4729c: профіль застосунку не копіює порожні картки сайту — заглушки
// «Мої відгуки», «Лояльність», «Реферали» і «Сертифікати» тут відсутні.
describe('ProfileScreen — без порожніх карток (T-4729)', () => {
  it('не має заглушок відгуків, лояльності, рефералів і сертифікатів', () => {
    const { queryByText } = render(<ProfileScreen />);
    for (const title of ['Мої відгуки', 'Лояльність', 'Реферали', 'Мої сертифікати']) {
      expect(queryByText(title)).toBeNull();
    }
  });
});
