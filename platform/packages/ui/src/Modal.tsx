import { Dialog } from './Dialog';
import type { DialogProps } from './Dialog';

export type ModalProps = Omit<DialogProps, 'placement'>;
export function Modal(props: ModalProps) {
  return <Dialog placement="center" {...props} />;
}

export const modal = Modal;
