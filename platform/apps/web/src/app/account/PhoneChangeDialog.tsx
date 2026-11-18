'use client';

import { AlertBanner, Button, Field, Modal } from '@fade/ui';
import { isCompleteUaPhone } from '../login/phoneFormat';
import type { PhoneChange } from './usePhoneChange';

/** Діалог зміни номера (T-4720b): крок номера → крок коду. Код — з нового
 * номера; невірний код лишається на кроці коду. */
export function PhoneChangeDialog({ flow }: { flow: PhoneChange }) {
  const open = flow.step !== 'closed';
  const onNumber = flow.step === 'number';
  return (
    <Modal open={open} onClose={flow.close} title="Змінити номер телефону">
      <form
        onSubmit={onNumber ? flow.submitNumber : flow.submitCode}
        className="flex flex-col gap-4"
      >
        {onNumber ? (
          <Field
            id="new-phone"
            label="Новий номер"
            help="Ми надішлемо код на цей номер. Поточний номер залишиться до підтвердження."
          >
            <input
              id="new-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={flow.phone}
              onChange={(e) => flow.setPhone(e.target.value)}
              disabled={flow.busy}
              className="h-11 rounded-input border border-line bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            />
          </Field>
        ) : (
          <Field id="phone-code" label="Код з SMS">
            <input
              id="phone-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={flow.code}
              onChange={(e) => flow.setCode(e.target.value)}
              disabled={flow.busy}
              placeholder="000000"
              className="h-11 rounded-input border border-line bg-surface-base px-3 font-text text-body tracking-[0.2em] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            />
          </Field>
        )}
        {flow.error ? <AlertBanner tone="error" title={flow.error} /> : null}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={flow.close} disabled={flow.busy}>
            Скасувати
          </Button>
          <Button
            type="submit"
            loading={flow.busy}
            disabled={flow.busy || (onNumber && !isCompleteUaPhone(flow.phone))}
          >
            {onNumber ? 'Отримати код' : 'Підтвердити'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
