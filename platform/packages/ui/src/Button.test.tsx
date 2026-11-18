import { fireEvent, render, screen } from '@testing-library/react';
import { Button, type ButtonVariant } from './Button';

describe('Button', () => {
  it('рендерить підпис і type=button за замовчуванням', () => {
    render(<Button>Записатись</Button>);
    const button = screen.getByRole('button', { name: 'Записатись' });
    expect(button.getAttribute('type')).toBe('button');
  });

  it('застосовує класи кожного варіанта', () => {
    const expected: Record<ButtonVariant, string> = {
      primary: 'bg-accent',
      secondary: 'bg-interactive',
      ghost: 'bg-transparent',
      destructive: 'bg-semantic-danger',
    };
    for (const [variant, className] of Object.entries(expected)) {
      const { unmount } = render(<Button variant={variant as ButtonVariant}>x</Button>);
      expect(screen.getByRole('button').className).toContain(className);
      unmount();
    }
  });

  it('застосовує розмір lg', () => {
    render(<Button size="lg">x</Button>);
    expect(screen.getByRole('button').className).toContain('h-12');
  });

  it('у стані loading вимкнений і позначає aria-busy', () => {
    render(<Button loading>Надіслати</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('не викликає onClick, коли вимкнений', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Ні
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('прокидає custom className', () => {
    render(<Button className="w-full">x</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });
});
