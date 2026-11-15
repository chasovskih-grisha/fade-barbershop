import { EmailTemplateEngine, EmailTemplateName } from "@fade/email-templates";

export interface SMSMessage {
  to: string;
  body: string;
}

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  appointmentReminders: boolean;
  marketingPromos: boolean;
}

export interface SendResult {
  success: boolean;
  channel: "email" | "sms" | "push";
  recipient: string;
  providerResponse?: any;
  error?: string;
}

export interface NotificationProvider {
  sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult>;
  sendSMS(message: SMSMessage): Promise<SendResult>;
  sendPush(payload: PushNotificationPayload): Promise<SendResult>;
}

/**
 * Mock / Test provider that records sent messages in-memory for testing and logging.
 */
export class MockNotificationProvider implements NotificationProvider {
  public sentEmails: Array<{ to: string; subject: string; html: string; text: string }> = [];
  public sentSMS: Array<SMSMessage> = [];
  public sentPush: Array<PushNotificationPayload> = [];

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult> {
    this.sentEmails.push({ to, subject, html, text });
    return { success: true, channel: "email", recipient: to, providerResponse: { messageId: `mock-email-${Date.now()}` } };
  }

  async sendSMS(message: SMSMessage): Promise<SendResult> {
    this.sentSMS.push(message);
    return { success: true, channel: "sms", recipient: message.to, providerResponse: { sid: `mock-sms-${Date.now()}` } };
  }

  async sendPush(payload: PushNotificationPayload): Promise<SendResult> {
    this.sentPush.push(payload);
    return { success: true, channel: "push", recipient: payload.token, providerResponse: { multicastId: `mock-push-${Date.now()}` } };
  }
}

export class NotificationManager {
  private emailEngine: EmailTemplateEngine;
  private provider: NotificationProvider;
  private preferencesStore: Map<string, NotificationPreferences> = new Map();

  constructor(provider?: NotificationProvider) {
    this.emailEngine = new EmailTemplateEngine();
    this.provider = provider || new MockNotificationProvider();
  }

  public setPreferences(prefs: NotificationPreferences): void {
    this.preferencesStore.set(prefs.userId, prefs);
  }

  public getPreferences(userId: string): NotificationPreferences {
    return (
      this.preferencesStore.get(userId) || {
        userId,
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        appointmentReminders: true,
        marketingPromos: true
      }
    );
  }

  public async sendTemplatedEmail(
    userId: string | undefined,
    to: string,
    templateName: EmailTemplateName,
    context: Record<string, any>
  ): Promise<SendResult> {
    if (userId) {
      const prefs = this.getPreferences(userId);
      if (!prefs.emailEnabled) {
        return { success: false, channel: "email", recipient: to, error: "User has disabled email notifications" };
      }
    }

    const { subject, html, text } = await this.emailEngine.render(templateName, context);
    return this.provider.sendEmail(to, subject, html, text);
  }

  public async sendSMSNotification(userId: string | undefined, to: string, body: string, isMarketing = false): Promise<SendResult> {
    if (userId) {
      const prefs = this.getPreferences(userId);
      if (!prefs.smsEnabled) {
        return { success: false, channel: "sms", recipient: to, error: "User has disabled SMS notifications" };
      }
      if (isMarketing && !prefs.marketingPromos) {
        return { success: false, channel: "sms", recipient: to, error: "User has disabled marketing promos" };
      }
      if (!isMarketing && !prefs.appointmentReminders) {
        return { success: false, channel: "sms", recipient: to, error: "User has disabled appointment reminders" };
      }
    }

    return this.provider.sendSMS({ to, body });
  }

  public async sendPushNotification(userId: string | undefined, token: string, title: string, body: string, data?: Record<string, string>, isMarketing = false): Promise<SendResult> {
    if (userId) {
      const prefs = this.getPreferences(userId);
      if (!prefs.pushEnabled) {
        return { success: false, channel: "push", recipient: token, error: "User has disabled push notifications" };
      }
      if (isMarketing && !prefs.marketingPromos) {
        return { success: false, channel: "push", recipient: token, error: "User has disabled marketing promos" };
      }
    }

    return this.provider.sendPush({ token, title, body, data });
  }

  public getProvider(): NotificationProvider {
    return this.provider;
  }
}
