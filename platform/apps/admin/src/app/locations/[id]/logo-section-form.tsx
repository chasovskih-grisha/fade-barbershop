import { Button } from '@fade/ui';
import type { LogoVariant } from './logo-fields';
import { LogoUploads } from './logo-uploads';

export function LogoSectionForm(props: {
  logo: boolean;
  busy: boolean;
  variant: LogoVariant;
  lightPreview: string | undefined;
  darkPreview: string | undefined;
  alt: string;
  altId: string;
  error: string | null;
  clientError: string | null;
  notice: string | null;
  onVariant: (value: LogoVariant) => void;
  onLight: (file: File) => void;
  onDark: (file: File) => void;
  onAlt: (value: string) => void;
  onRemove: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Логотип</h2>
        {props.logo && (
          <Button variant="secondary" onClick={props.onRemove} disabled={props.busy}>
            Видалити
          </Button>
        )}
      </div>
      <p className="text-body text-fg-muted">
        Світле зображення обов&apos;язкове — воно використовується в темній темі, коли темного
        варіанта немає. Темне поле додається окремо, якщо лого потрібне саме на світлому тлі.
      </p>
      <LogoUploads
        busy={props.busy}
        variant={props.variant}
        lightPreview={props.lightPreview}
        darkPreview={props.darkPreview}
        onVariant={props.onVariant}
        onLight={props.onLight}
        onDark={props.onDark}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor={props.altId} className="text-body text-fg-secondary">
          Alt-текст
        </label>
        <textarea
          id={props.altId}
          value={props.alt}
          onChange={(event) => props.onAlt(event.target.value)}
          placeholder="Логотип «Імʼя локації» — знак і назва"
          disabled={props.busy}
          maxLength={120}
          className="min-h-20 w-full rounded-input border border-line bg-surface-sunken p-3 text-body text-fg"
        />
        <p className="text-caption text-fg-muted">Обов&apos;язково. До 120 символів.</p>
      </div>
      {props.error && (
        <p className="text-body text-danger" role="alert">
          {props.error}
        </p>
      )}
      {props.clientError && (
        <p className="text-body text-danger" role="alert">
          {props.clientError}
        </p>
      )}
      {props.notice && (
        <p role="status" className="text-semantic-success">
          {props.notice}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={props.onSave} disabled={props.busy}>
          {props.busy ? 'Збереження…' : 'Зберегти логотип'}
        </Button>
        <Button variant="secondary" onClick={props.onReset} disabled={props.busy}>
          Скасувати
        </Button>
      </div>
    </section>
  );
}
