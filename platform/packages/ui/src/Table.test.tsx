import { render, screen } from '@testing-library/react';
import { Table, TBody, TD, TH, THead, TR } from './Table';

describe('Table', () => {
  it('рендерить заголовки і комірки', () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH>Імʼя</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>Олег</TD>
          </TR>
        </TBody>
      </Table>
    );
    expect(screen.getByRole('columnheader', { name: 'Імʼя' }).getAttribute('scope')).toBe('col');
    expect(screen.getByRole('cell', { name: 'Олег' })).toBeTruthy();
  });

  it('прокидає className і data-атрибути', () => {
    render(
      <Table className="min-w-full" data-testid="table">
        <TBody>
          <TR>
            <TD>x</TD>
          </TR>
        </TBody>
      </Table>
    );
    expect(screen.getByTestId('table').className).toContain('min-w-full');
  });
});
