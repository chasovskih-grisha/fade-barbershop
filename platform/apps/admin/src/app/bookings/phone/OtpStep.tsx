'use client';

// Крок 1 (T-4409 UI): верифікація номера — надіслати код, ввести прочитаний.
interface OtpStepProps {
  phone: string;
  code: string;
  busy: boolean;
  error: string;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSend: () => void;
  onConfirm: () => void;
}

export default function OtpStep({
  phone,
  code,
  busy,
  error,
  onPhoneChange,
  onCodeChange,
  onSend,
  onConfirm,
}: OtpStepProps) {
  return (
    <section aria-label="Верифікація номера">
      <label className="block mb-2" htmlFor="phone">
        Номер клієнта
      </label>
      <input
        id="phone"
        className="border rounded px-3 py-2 w-full mb-3"
        placeholder="+380…"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
      />
      <button
        type="button"
        className="border rounded px-4 py-2 mr-2"
        onClick={onSend}
        disabled={busy || !phone}
      >
        Надіслати код
      </button>
      <label className="block mt-4 mb-2" htmlFor="code">
        Код з SMS (клієнт диктує)
      </label>
      <input
        id="code"
        className="border rounded px-3 py-2 w-full mb-3"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
      />
      <button
        type="button"
        className="border rounded px-4 py-2"
        onClick={onConfirm}
        disabled={busy || code.length < 6}
      >
        Підтвердити
      </button>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
