import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  MobileButton,
  MobileSkeleton,
  MobilePhoneInput,
  MobileSlotPicker,
  MobilePriceBreakdown,
} from './kit';

describe('Mobile UI Kit T-4509', () => {
  it('renders button and shows spinner and disabled state when loading', () => {
    const { getByTestId, queryByText } = render(
      <MobileButton title="Submit" loading={true} onPress={() => {}} testID="submit-btn" />
    );
    const btn = getByTestId('submit-btn');
    expect(btn.props.accessibilityState?.disabled || btn.props.disabled).toBeTruthy();
    expect(getByTestId('submit-spinner')).toBeTruthy();
    expect(queryByText('Submit')).toBeNull();
  });

  it('renders skeleton nodes while list is loading', () => {
    const { getByTestId } = render(<MobileSkeleton testID="loading-skeleton" />);
    expect(getByTestId('loading-skeleton')).toBeTruthy();
  });

  it('renders phone input correctly', () => {
    const { getByTestId } = render(
      <MobilePhoneInput value="+380991234567" onChangeText={() => {}} testID="phone-input" />
    );
    expect(getByTestId('phone-input').props.value).toBe('+380991234567');
  });

  it('renders slot picker and handles selection', () => {
    const onSelect = jest.fn();
    const slots = [{ id: '1', time: '10:00', available: true }];
    const { getByText } = render(
      <MobileSlotPicker slots={slots} selectedId="" onSelect={onSelect} />
    );
    fireEvent.press(getByText('10:00'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('renders price breakdown correctly', () => {
    const { getAllByText, getByText } = render(
      <MobilePriceBreakdown items={[{ label: 'Стрижка', price: 500 }]} total={500} />
    );
    expect(getByText('Стрижка')).toBeTruthy();
    expect(getAllByText('500 ₴').length).toBeGreaterThan(0);
  });
});
