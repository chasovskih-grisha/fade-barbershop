import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BiometricLoginPrompt } from './BiometricLoginPrompt';

describe('BiometricLoginPrompt (T-4426)', () => {
  it('показує кнопку і повідомляє про натиск', () => {
    const onPress = jest.fn();
    const { getByText, getByLabelText } = render(
      <BiometricLoginPrompt error={null} onPress={onPress} />
    );

    fireEvent.press(getByText('Увійти за допомогою Face ID / Touch ID'));

    expect(onPress).toHaveBeenCalled();
    expect(getByLabelText('Увійти за допомогою Face ID / Touch ID')).toBeTruthy();
  });

  it('показує помилку, коли її передано', () => {
    const { getByText } = render(
      <BiometricLoginPrompt
        error="Біометричну перевірку не пройдено. Спробуйте ще раз."
        onPress={jest.fn()}
      />
    );

    expect(getByText('Біометричну перевірку не пройдено. Спробуйте ще раз.')).toBeTruthy();
  });

  it('без помилки тексту помилки немає', () => {
    const { queryByText } = render(<BiometricLoginPrompt error={null} onPress={jest.fn()} />);

    expect(queryByText('Біометричну перевірку не пройдено. Спробуйте ще раз.')).toBeNull();
  });
});
