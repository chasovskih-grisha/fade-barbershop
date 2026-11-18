import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountProfileCard } from './AccountProfileCard';
import { PhoneChangeDialog } from './PhoneChangeDialog';
import type { PhoneChange } from './usePhoneChange';

function flow(overrides: Partial<PhoneChange> = {}): PhoneChange {
  return {
    step: 'number',
    phone: '+380991234567',
    code: '',
    error: null,
    busy: false,
    open: jest.fn(),
    close: jest.fn(),
    setPhone: jest.fn(),
    setCode: jest.fn(),
    submitNumber: jest.fn(),
    submitCode: jest.fn(),
    ...overrides,
  };
}

describe('картка акаунта (T-4720b)', () => {
  it('більше не радить змінювати номер через підтримку', () => {
    render(
      <AccountProfileCard
        name="Олександр"
        phone="+380991234567"
        saving={false}
        canSave={false}
        onNameChange={jest.fn()}
        onSave={jest.fn()}
        onChangePhone={jest.fn()}
      />
    );
    expect(screen.queryByText(/через підтримку/i)).toBeNull();
    expect(screen.getByRole('button', { name: 'Змінити номер' })).toBeInTheDocument();
    expect(screen.getByLabelText('Номер телефону')).toHaveAttribute('readonly');
  });

  it('кнопка «Змінити номер» відкриває флоу', () => {
    const onChangePhone = jest.fn();
    render(
      <AccountProfileCard
        name="Олександр"
        phone="+380991234567"
        saving={false}
        canSave={false}
        onNameChange={jest.fn()}
        onSave={jest.fn()}
        onChangePhone={onChangePhone}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Змінити номер' }));
    expect(onChangePhone).toHaveBeenCalledTimes(1);
  });
});

describe('діалог зміни номера (T-4720b)', () => {
  it('крок номера надсилає форму через submitNumber', () => {
    const f = flow();
    render(<PhoneChangeDialog flow={f} />);
    fireEvent.click(screen.getByRole('button', { name: 'Отримати код' }));
    expect(f.submitNumber).toHaveBeenCalledTimes(1);
  });

  it('крок коду надсилає форму через submitCode', () => {
    const f = flow({ step: 'code', code: '123456' });
    render(<PhoneChangeDialog flow={f} />);
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    expect(f.submitCode).toHaveBeenCalledTimes(1);
  });

  it('невірний код показує помилку на кроці коду', () => {
    render(
      <PhoneChangeDialog flow={flow({ step: 'code', error: 'Невірний код. Спробуйте ще раз.' })} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Невірний код');
  });
});
