import { PhotoUpload } from '@fade/ui';
import { LOGO_VARIANTS, type LogoVariant } from './logo-fields';

export function LogoUploads(props: {
  busy: boolean;
  variant: LogoVariant;
  lightPreview: string | undefined;
  darkPreview: string | undefined;
  onVariant: (value: LogoVariant) => void;
  onLight: (file: File) => void;
  onDark: (file: File) => void;
}) {
  const { busy, variant, lightPreview, darkPreview, onVariant, onLight, onDark } = props;
  return (
    <>
      <PhotoUpload
        label="Світле (light)"
        previewUrl={lightPreview}
        onSelect={onLight}
        disabled={busy}
      />
      <PhotoUpload
        label="Темне (dark, опціонально)"
        previewUrl={darkPreview}
        onSelect={onDark}
        disabled={busy}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-body text-fg-secondary">Варіант</legend>
        {LOGO_VARIANTS.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="logo-variant"
              value={option.value}
              checked={variant === option.value}
              onChange={() => onVariant(option.value)}
              disabled={busy}
              className="h-4 w-4 accent-fg"
            />
            <span className="text-body">{option.label}</span>
          </label>
        ))}
      </fieldset>
    </>
  );
}
