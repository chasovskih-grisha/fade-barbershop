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

export interface QuietHoursConfig {
  startHour: number; // e.g. 22 (10 PM)
  endHour: number;   // e.g. 8 (8 AM)
  timezone?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  appointmentReminders: boolean;
  marketingPromos: boolean;
  quietHours?: QuietHoursConfig;
}

export interface SendResult {
  success: boolean;
  channel: "email" | "sms" | "push";
  recipient: string;
  providerResponse?: any;
  error?: string;
  fallbackUsed?: boolean;
}

export interface AuditEvent {
  timestamp: string;
  userId?: string;
  channel: "email" | "sms" | "push";
  recipient: string;
  success: boolean;
  error?: string;
  fallbackUsed?: boolean;
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
  public failPushNext = false;
  public failSMSNext = false;

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult> {
    this.sentEmails.push({ to, subject, html, text });
    return { success: true, channel: "email", recipient: to, providerResponse: { messageId: `mock-email-${Date.now()}` } };
  }

  async sendSMS(message: SMSMessage): Promise<SendResult> {
    if (this.failSMSNext) {
      this.failSMSNext = false;
      return { success: false, channel: "sms", recipient: message.to, error: "SMS gateway timeout" };
    }
    this.sentSMS.push(message);
    return { success: true, channel: "sms", recipient: message.to, providerResponse: { sid: `mock-sms-${Date.now()}` } };
  }

  async sendPush(payload: PushNotificationPayload): Promise<SendResult> {
    if (this.failPushNext) {
      this.failPushNext = false;
      return { success: false, channel: "push", recipient: payload.token, error: "APNS/FCM token unregistered or unreachable" };
    }
    this.sentPush.push(payload);
    return { success: true, channel: "push", recipient: payload.token, providerResponse: { multicastId: `mock-push-${Date.now()}` } };
  }
}

export class NotificationManager {
  private emailEngine: EmailTemplateEngine;
  private provider: NotificationProvider;
  private preferencesStore: Map<string, NotificationPreferences> = new Map();
  private auditTrail: AuditEvent[] = [];

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

  public getAuditTrail(): AuditEvent[] {
    return this.auditTrail;
  }

  private recordAudit(userId: string | undefined, channel: "email" | "sms" | "push", recipient: string, success: boolean, error?: string, fallbackUsed?: boolean) {
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      userId,
      channel,
      recipient,
      success,
      error,
      fallbackUsed
    });
  }

  private isQuietHoursActive(prefs: NotificationPreferences, isUrgent = false): boolean {
    if (isUrgent || !prefs.quietHours) {
      return false;
    }
    const currentHour = new Date().getHours();
    const { startHour, endHour } = prefs.quietHours;
    if (startHour > endHour) {
      // e.g. 22 to 8 (crosses midnight)
      return currentHour >= startHour || currentHour < endHour;
    } else {
      return currentHour >= startHour && currentHour < endHour;
    }
  }

  public async sendTemplatedEmail(
    userId: string | undefined,
    to: string,
    templateName: EmailTemplateName,
    context: Record<string, any>,
    isUrgent = false
  ): Promise<SendResult> {
    if (userId) {
      const prefs = this.getPreferences(userId);
      if (!prefs.emailEnabled) {
        const res: SendResult = { success: false, channel: "email", recipient: to, error: "User has disabled email notifications" };
        this.recordAudit(userId, "email", to, false, res.error);
        return res;
      }
      if (this.isQuietHoursActive(prefs, isUrgent)) {
        const res: SendResult = { success: false, channel: "email", recipient: to, error: "Quiet hours active; non-urgent email deferred" };
        this.recordAudit(userId, "email", to, false, res.error);
        return res;
      }
    }

    const { subject, html, text } = await this.emailEngine.render(templateName, context);
    const result = await this.provider.sendEmail(to, subject, html, text);
    this.recordAudit(userId, "email", to, result.success, result.error);
    return result;
  }

  public async sendSMSNotification(userId: string | undefined, to: string, body: string, isMarketing = false, isUrgent = false): Promise<SendResult> {
    if (userId) {
      const prefs = this.getPreferences(userId);
      if (!prefs.smsEnabled) {
        const res: SendResult = { success: false, channel: "sms", recipient: to, error: "User has disabled SMS notifications" };
        this.recordAudit(userId, "sms", to, false, res.error);
        return res;
      }
      if (isMarketing && !prefs.marketingPromos) {
        const res: SendResult = { success: false, channel: "sms", recipient: to, error: "User has disabled marketing promos" };
        this.recordAudit(userId, "sms", to, false, res.error);
        return res;
      }
      if (!isMarketing && !prefs.appointmentReminders) {
        const res: SendResult = { success: false, channel: "sms", recipient: to, error: "User has disabled appointment reminders" };
        this.recordAudit(userId, "sms", to, false, res.error);
        return res;
      }
      if (this.isQuietHoursActive(prefs, isUrgent)) {
        const res: SendResult = { success: false, channel: "sms", recipient: to, error: "Quiet hours active; non-urgent SMS deferred" };
        this.recordAudit(userId, "sms", to, false, res.error);
        return res;
      }
    }

    const result = await this.provider.sendSMS({ to, body });
    this.recordAudit(userId, "sms", to, result.success, result.error);
    return result;
  }

  public async sendPushNotification(userId: string | undefined, token: string, title: string, body: string, data?: Record<string, string>, isMarketing = false, isUrgent = false): Promise<SendResult> {
    if (userId) {
      const prefs = this.getPreferences(userId);
      if (!prefs.pushEnabled) {
        const res: SendResult = { success: false, channel: "push", recipient: token, error: "User has disabled push notifications" };
        this.recordAudit(userId, "push", token, false, res.error);
        return res;
      }
      if (isMarketing && !prefs.marketingPromos) {
        const res: SendResult = { success: false, channel: "push", recipient: token, error: "User has disabled marketing promos" };
        this.recordAudit(userId, "push", token, false, res.error);
        return res;
      }
      if (this.isQuietHoursActive(prefs, isUrgent)) {
        const res: SendResult = { success: false, channel: "push", recipient: token, error: "Quiet hours active; non-urgent push deferred" };
        this.recordAudit(userId, "push", token, false, res.error);
        return res;
      }
    }

    const result = await this.provider.sendPush({ token, title, body, data });
    this.recordAudit(userId, "push", token, result.success, result.error);
    return result;
  }

  /**
   * Smart multi-channel delivery with fallback (e.g. Push -> SMS -> Email)
   */
  public async sendSmartNotification(
    userId: string,
    channels: Array<{ channel: "push" | "sms" | "email"; target: string; payload: any }>,
    isUrgent = false
  ): Promise<SendResult> {
    let lastError = "All channels failed or disabled";

    for (const item of channels) {
      if (item.channel === "push") {
        const res = await this.sendPushNotification(userId, item.target, item.payload.title, item.payload.body, item.payload.data, item.payload.isMarketing, isUrgent);
        if (res.success) {
          return { ...res, fallbackUsed: channels.indexOf(item) > 0 };
        }
        lastError = res.error || lastError;
      } else if (item.channel === "sms") {
        const res = await this.sendSMSNotification(userId, item.target, item.payload.body, item.payload.isMarketing, isUrgent);
        if (res.success) {
          return { ...res, fallbackUsed: channels.indexOf(item) > 0 };
        }
        lastError = res.error || lastError;
      } else if (item.channel === "email") {
        const res = await this.sendTemplatedEmail(userId, item.target, item.payload.templateName, item.payload.context, isUrgent);
        if (res.success) {
          return { ...res, fallbackUsed: channels.indexOf(item) > 0 };
        }
        lastError = res.error || lastError;
      }
    }

    return { success: false, channel: channels[channels.length - 1]?.channel || "email", recipient: channels[channels.length - 1]?.target || "", error: lastError };
  }

  public getProvider(): NotificationProvider {
    return this.provider;
  }
}
