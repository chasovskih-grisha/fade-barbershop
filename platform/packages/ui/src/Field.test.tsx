import { render, screen } from '@testing-library/react';
import { Field } from './Field';
import { TextField } from './TextField';

describe('Field', () => {
  it('звʼязує label з контролом', () => {
    render(
      <Field id="phone" label="Телефон">
        <input id="phone" />
      </Field>
    );
    expect(screen.getByLabelText('Телефон')).toBeTruthy();
  });

  it('показує help і підключає його через aria-describedby', () => {
    render(
      <Field id="phone" label="Телефон" help="Формат +38">
        <input id="phone" aria-describedby="phone-help" />
      </Field>
    );
    expect(screen.getByText('Формат +38')).toBeTruthy();
  });

  it('показує помилку як alert і не показує help', () => {
    render(
      <Field id="phone" label="Телефон" help="Формат +38" error="Введіть номер">
        <input id="phone" />
      </Field>
    );
    expect(screen.getByRole('alert').textContent).toBe('Введіть номер');
    expect(screen.queryByText('Формат +38')).toBeNull();
  });

  it('позначає required-поле', () => {
    render(
      <Field id="phone" label="Телефон" required>
        <input id="phone" />
      </Field>
    );
    expect(screen.getByText('*')).toBeTruthy();
  });
});

describe('TextField', () => {
  it('рендерить поле з label', () => {
    render(<TextField label="Імʼя" />);
    expect(screen.getByLabelText('Імʼя')).toBeTruthy();
  });

  it('передає стан помилки в aria-invalid і клас', () => {
    const { container } = render(<TextField label="Імʼя" error="Обовʼязково" />);
    const input = container.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.className).toContain('border-semantic-danger');
    expect(input?.getAttribute('aria-describedby')).toContain('-error');
  });

  it('підключає help', () => {
    render(<TextField label="Імʼя" help="Як у паспорті" />);
    expect(screen.getByText('Як у паспорті')).toBeTruthy();
  });
});
