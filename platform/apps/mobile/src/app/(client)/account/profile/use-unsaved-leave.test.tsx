import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useUnsavedLeave } from './use-unsaved-leave';
import { UnsavedPrompt } from './unsaved-prompt';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const push = router.push as jest.Mock;
const VISITS = '/(client)/account/appointments';

function Harness({ dirty, saveAll }: { dirty: boolean; saveAll: () => Promise<boolean> }) {
  const guard = useUnsavedLeave(dirty, saveAll);
  return (
    <>
      <Text testID="door" onPress={() => guard.leave(VISITS)}>
        Мої візити
      </Text>
      <UnsavedPrompt prompt={guard} />
    </>
  );
}

describe('useUnsavedLeave — питання перед виходом (T-4733c)', () => {
  beforeEach(() => push.mockReset());

  it('чиста форма відкриває візити без питання', () => {
    const { getByTestId, queryByTestId } = render(<Harness dirty={false} saveAll={jest.fn()} />);

    fireEvent.press(getByTestId('door'));

    expect(push).toHaveBeenCalledWith(VISITS);
    expect(queryByTestId('profile-unsaved-prompt')).toBeNull();
  });

  it('змінена форма питає перед візитами', () => {
    const { getByTestId } = render(<Harness dirty saveAll={jest.fn()} />);

    fireEvent.press(getByTestId('door'));

    expect(push).not.toHaveBeenCalled();
    expect(getByTestId('profile-unsaved-prompt')).toBeTruthy();
  });

  it('«Залишитись» не відкриває візити', () => {
    const { getByTestId, queryByTestId } = render(<Harness dirty saveAll={jest.fn()} />);

    fireEvent.press(getByTestId('door'));
    fireEvent.press(getByTestId('profile-unsaved-stay'));

    expect(push).not.toHaveBeenCalled();
    expect(queryByTestId('profile-unsaved-prompt')).toBeNull();
  });

  it('«Не зберігати» відкриває візити', () => {
    const { getByTestId } = render(<Harness dirty saveAll={jest.fn()} />);

    fireEvent.press(getByTestId('door'));
    fireEvent.press(getByTestId('profile-unsaved-discard'));

    expect(push).toHaveBeenCalledWith(VISITS);
  });

  it('«Зберегти» переходить лише після успішного збереження', async () => {
    const saveAll = jest.fn().mockResolvedValue(true);
    const { getByTestId } = render(<Harness dirty saveAll={saveAll} />);

    fireEvent.press(getByTestId('door'));
    fireEvent.press(getByTestId('profile-unsaved-save'));

    await waitFor(() => expect(push).toHaveBeenCalledWith(VISITS));
    expect(saveAll).toHaveBeenCalled();
  });

  it('невдале збереження лишає на профілі', async () => {
    const saveAll = jest.fn().mockResolvedValue(false);
    const { getByTestId } = render(<Harness dirty saveAll={saveAll} />);

    fireEvent.press(getByTestId('door'));
    fireEvent.press(getByTestId('profile-unsaved-save'));

    await waitFor(() => expect(saveAll).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
    expect(getByTestId('profile-unsaved-prompt')).toBeTruthy();
  });

  it('показує три відповіді сайту', () => {
    const { getByTestId, getByText } = render(<Harness dirty saveAll={jest.fn()} />);

    fireEvent.press(getByTestId('door'));

    expect(getByText('Зберегти зміни?')).toBeTruthy();
    expect(getByText('Зберегти')).toBeTruthy();
    expect(getByText('Не зберігати')).toBeTruthy();
    expect(getByText('Залишитись')).toBeTruthy();
  });
});
