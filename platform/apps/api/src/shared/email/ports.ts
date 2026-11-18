// Порт EmailSender (T-4408): контракт, який домен/use cases вимагають від
// інфраструктури. Реалізації — console (дефолт dev), mailpit (dev/test Web UI),
// smtp (прод, T-4202). HTML опційний — текстові листи першокласні.
export interface EmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(input: EmailInput): Promise<void>;
}

export type EmailProviderName = 'console' | 'mailpit' | 'smtp';
