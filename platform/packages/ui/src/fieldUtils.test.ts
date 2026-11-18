import { messageIds } from './fieldUtils';

describe('messageIds', () => {
  it('повертає лише help id, коли немає помилки', () => {
    expect(messageIds('phone', 'help text')).toEqual({
      helpId: 'phone-help',
      errorId: undefined,
      describedBy: 'phone-help',
    });
  });

  it('віддає пріоритет помилці над help', () => {
    expect(messageIds('phone', 'help text', 'error text')).toEqual({
      helpId: undefined,
      errorId: 'phone-error',
      describedBy: 'phone-error',
    });
  });

  it('повертає undefined, коли немає ні help, ні помилки', () => {
    expect(messageIds('phone')).toEqual({
      helpId: undefined,
      errorId: undefined,
      describedBy: undefined,
    });
  });
});
