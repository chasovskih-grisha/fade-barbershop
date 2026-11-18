import { Dialog } from './Dialog';
import type { DialogProps } from './Dialog';

export type SheetProps = Omit<DialogProps, 'placement'> & {
  showCloseButton?: boolean;
};

export function Sheet({ showCloseButton, ...props }: SheetProps) {
  return <Dialog placement="bottom" {...props} showCloseButton={showCloseButton ?? true} />;
}

export const sheet = Sheet;
