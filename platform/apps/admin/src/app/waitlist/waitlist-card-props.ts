export type WaitlistToastTone = 'success' | 'danger';

export interface WaitlistCardProps {
  busy: boolean;
  setBusy: (busy: boolean) => void;
  notify: (title: string, tone: WaitlistToastTone) => void;
  onDone: () => void;
}
