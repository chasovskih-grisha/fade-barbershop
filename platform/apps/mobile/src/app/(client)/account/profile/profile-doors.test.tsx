import { fireEvent, render } from '@testing-library/react-native';
import { ProfileDoors } from './profile-doors';

describe('ProfileDoors — переходи акаунта (T-4732c)', () => {
  it('показує «Мої візити» і «Пристрої»', () => {
    const { getByText } = render(<ProfileDoors onOpen={jest.fn()} />);
    expect(getByText('Мої візити')).toBeTruthy();
    expect(getByText('Пристрої')).toBeTruthy();
  });

  it('не показує рядок «Реферали»', () => {
    const { queryByText } = render(<ProfileDoors onOpen={jest.fn()} />);
    expect(queryByText('Реферали')).toBeNull();
  });

  it('передає адресу наявного екрана візитів', () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(<ProfileDoors onOpen={onOpen} />);
    fireEvent.press(getByTestId('profile-door-visits'));
    expect(onOpen).toHaveBeenCalledWith('/(client)/account/appointments');
  });

  it('передає адресу наявного екрана пристроїв', () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(<ProfileDoors onOpen={onOpen} />);
    fireEvent.press(getByTestId('profile-door-devices'));
    expect(onOpen).toHaveBeenCalledWith('/(client)/account/devices');
  });

  it('веде барбера в «Мій графік» — там позначка «не вийду» (T-4616b)', () => {
    const onOpen = jest.fn();
    const { getByTestId, getByText } = render(<ProfileDoors onOpen={onOpen} />);
    expect(getByText('Мій графік')).toBeTruthy();
    fireEvent.press(getByTestId('profile-door-schedule'));
    expect(onOpen).toHaveBeenCalledWith('/(client)/barber-schedule');
  });
});
