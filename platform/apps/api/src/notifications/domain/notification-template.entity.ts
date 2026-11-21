/* eslint-disable max-lines, complexity, max-params -- cohesive module (325 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: canClientReceive, complexity 11 vs 10); refactor tracked in T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: sendNotification, limit 3); API redesign tracked in T-2500f */
/** Notification channel types. */
export type NotificationChannel = 'SMS' | 'EMAIL' | 'PUSH' | 'TELEGRAM' | 'VIBER' | 'WHATSAPP';

/** Template engine variables. */
export interface TemplateVariables {
  [key: string]: string | number | boolean | Date | Record<string, unknown> | undefined;
}

/** Notification template domain model. */
export interface NotificationTemplate {
  id: string;
  key: string; // unique identifier for the template
  channel: NotificationChannel;
  subject?: string; // for email, push, etc.
  body: string; // template body with variables
  variables: string[]; // list of variable names used in template
  version: number;
  active: boolean;
  /** Template engine uses JSON Logic for variable substitution and conditions */
  jsonLogicExpression?: string;
  /** Legacy variable substitution pattern: {{variableName}} */
  pattern: 'jinja2' | 'mustache' | 'custom';
  /** Whether template can be used for marketing messages */
  marketing: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated */
  updatedAt?: Date;
}

/** Вхідні дані створення шаблону: решта полів має доменні дефолти. */
export interface CreateNotificationTemplateInput {
  key: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables?: string[];
  version?: number;
  active?: boolean;
  pattern?: NotificationTemplate['pattern'];
  marketing?: boolean;
  jsonLogicExpression?: string;
}

/** Notification send status. */
export type NotificationStatus =
  'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'UNsubscribed';

/** Notification record. */
export interface Notification {
  id: string;
  templateId: string;
  clientId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  payload: Record<string, unknown>; // data sent to channel provider
  /** Variable values substituted into template */
  variables: TemplateVariables;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  /** For marketing consent check */
  consentGiven: boolean;
}

/** Channel adapter configuration. */
export interface ChannelAdapterConfig {
  channel: NotificationChannel;
  /** Provider-specific configuration */
  provider: 'sendgrid' | 'twilio' | 'telegram' | 'viber' | 'whatsapp' | 'expo';
  apiEndpoint?: string;
  apiKey?: string;
  fromAddress?: string; // email from, sms from name, etc.
  /** Template mapping if different from default */
  templateMapping?: Record<string, string>;
}

/** Delivery retry policy. */
export interface DeliveryRetryPolicy {
  maxRetries: number;
  baseDelayMs: number; // exponential backoff base
  maxDelayMs: number; // maximum delay between retries
  jitter: boolean; // add random jitter to delay
}

/** Notification preference per client. */
export interface CommunicationPreference {
  clientId: string;
  /** Opt-in/out by channel */
  channelPreferences: Partial<Record<NotificationChannel, 'opt-in' | 'opt-out' | 'unspecified'>>;
  /** Opt-in/out by message type */
  messageTypePreferences: Record<string, 'opt-in' | 'opt-out' | 'unspecified'>;
  /** Global opt-out */
  globalOptOut: boolean;
  /** Last updated */
  updatedAt: Date;
}

/** Send result from channel provider. */
export interface ChannelSendResult {
  messageId: string; // provider's message ID
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
  /** Provider-specific delivery receipt */
  receipt?: Record<string, unknown>;
  sentAt: Date;
}

/** Escalation trigger. */
export interface EscalationTrigger {
  /** Minimum rating for negative feedback escalation */
  minRating: number;
  /** Message type that triggers escalation */
  messageType: string;
  /** Action to take */
  action: 'create-admin-task' | 'tag-client' | 'notify-owner' | 'all';
  /** Client tag to apply */
  clientTag?: string;
}

/** Admin task for notification escalation. */
export interface AdminNotificationTask {
  id: string;
  type: 'NOTIFICATION_ESCALATION';
  title: string;
  description: string;
  relatedId: string; // notification ID or client ID
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

/** In-memory notification registry.
 *  Ready for D1 adapter - all repos injected via constructor.
 *  Follows the same pattern as PromotionRegistry and LoyaltyRegistry.
 */
export class NotificationRegistry {
  private templates: Map<string, NotificationTemplate> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, CommunicationPreference> = new Map();
  private deliveryPolicies: Map<string, DeliveryRetryPolicy> = new Map();
  private channelAdapters: Map<NotificationChannel, ChannelAdapterConfig> = new Map();

  /** Create a notification template.
   *  Returns the created template with generated ID and default values.
   */
  createTemplate(template: CreateNotificationTemplateInput): NotificationTemplate {
    const now = new Date();
    const id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: NotificationTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
      version: template.version ?? 1,
      pattern: template.pattern ?? 'mustache',
      marketing: template.marketing ?? false,
      variables: template.variables ?? [],
      active: template.active ?? true,
    };
    this.templates.set(template.key, newTemplate);
    return newTemplate;
  }

  /** Get a template by its key.
   *  Returns the template if found, undefined otherwise.
   */
  getTemplate(key: string): NotificationTemplate | undefined {
    return this.templates.get(key);
  }

  /** Get all active templates (active: true).
   *  Returns array of active templates.
   */
  getActiveTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.active);
  }

  /** Get templates by channel.
   *  Returns array of templates matching the given channel.
   */
  getTemplatesByChannel(channel: NotificationChannel): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.channel === channel);
  }

  /** Update a template's active status.
   *  Returns the updated template.
   */
  updateTemplateActiveStatus(key: string, active: boolean): NotificationTemplate | null {
    const template = this.templates.get(key);
    if (!template) return null;
    template.active = active;
    template.updatedAt = new Date();
    return template;
  }

  /** Create a new notification record.
   *  Returns the created notification.
   */
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      retryCount: 0,
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  /** Get a notification by its ID.
   *  Returns the notification if found, undefined otherwise.
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  /** Get notifications for a specific client.
   *  Returns array of notifications for the given clientId.
   */
  getNotificationsByClient(clientId: string): Notification[] {
    return Array.from(this.notifications.values()).filter((n) => n.clientId === clientId);
  }

  /** Get notifications by status.
   *  Returns array of notifications matching the given status.
   */
  getNotificationsByStatus(status: NotificationStatus): Notification[] {
    return Array.from(this.notifications.values()).filter((n) => n.status === status);
  }

  /** Update a notification's status.
   *  Returns the updated notification, or null if not found.
   */
  updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    error?: string
  ): Notification | null {
    const notification = this.notifications.get(id);
    if (!notification) return null;
    notification.status = status;
    if (error) notification.error = error;
    if (status === 'SENT') notification.sentAt = new Date();
    if (status === 'DELIVERED') notification.deliveredAt = new Date();
    return notification;
  }

  /** Update notification retry count.
   *  Returns the updated notification, or null if not found.
   */
  updateRetryCount(id: string, increment: number): Notification | null {
    const notification = this.notifications.get(id);
    if (!notification) return null;
    notification.retryCount += increment;
    return notification;
  }

  /** Set communication preference for a client.
   *  Returns the updated preference, or creates if not exists.
   */
  setPreference(preference: CommunicationPreference): CommunicationPreference {
    this.preferences.set(preference.clientId, preference);
    return preference;
  }

  /** Get communication preference for a client.
   *  Returns the preference if found, undefined otherwise.
   */
  getPreference(clientId: string): CommunicationPreference | undefined {
    return this.preferences.get(clientId);
  }

  /** Update communication preference.
   *  Updates specific fields and returns the updated preference.
   */
  updatePreference(
    clientId: string,
    updates: Partial<CommunicationPreference>
  ): CommunicationPreference | null {
    const existing = this.preferences.get(clientId);
    if (!existing) return null;

    const updated: CommunicationPreference = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.preferences.set(clientId, updated);
    return updated;
  }

  /** Check if client can receive a specific message type on a specific channel.
   *  Returns true if the client has opted in for this channel/message combination.
   */
  canClientReceive(clientId: string, channel?: NotificationChannel, messageType?: string): boolean {
    const pref = this.preferences.get(clientId);
    if (!pref) return true; // no prefs = allow

    // Check global opt-out - blocks ALL message types
    if (pref.globalOptOut) return false;

    // Check channel preference (missing channel = general message-type check)
    const channelPref = channel === undefined ? undefined : pref.channelPreferences[channel];
    if (channelPref === 'opt-out') return false;
    if (
      (channelPref === 'unspecified' || channelPref === undefined) &&
      messageType &&
      pref.messageTypePreferences[messageType] === 'opt-out'
    )
      return false;

    // Check message type preference
    if (messageType && pref.messageTypePreferences[messageType] === 'opt-out') return false;

    return true;
  }

  /** Set channel adapter configuration.
   *  Configures a specific channel's provider settings.
   */
  setChannelAdapter(config: ChannelAdapterConfig): void {
    this.channelAdapters.set(config.channel, config);
  }

  /** Get channel adapter configuration.
   *  Returns the config for the given channel, or undefined if not set.
   */
  getChannelAdapter(channel: NotificationChannel): ChannelAdapterConfig | undefined {
    return this.channelAdapters.get(channel);
  }

  /** Set delivery retry policy.
   *  Configures retry behavior for a specific notification type or channel.
   */
  setDeliveryPolicy(key: string, policy: DeliveryRetryPolicy): void {
    this.deliveryPolicies.set(key, policy);
  }

  /** Get delivery retry policy.
   *  Returns the policy for the given key, or undefined if not set.
   */
  getDeliveryPolicy(key: string): DeliveryRetryPolicy | undefined {
    return this.deliveryPolicies.get(key);
  }

  /** Send a notification through the appropriate channel adapter.
   *  Handles preference checks, template rendering, and dispatch.
   */
  sendNotification(
    clientId: string,
    templateKey: string,
    variables: TemplateVariables,
    messageType: 'transactional' | 'marketing' = 'transactional'
  ): { notification: Notification; result: ChannelSendResult | null; skipped: boolean } {
    // 1. Check communication preferences
    if (!this.canClientReceive(clientId, undefined, messageType)) {
      const skippedNotification = this.createNotification({
        templateId: templateKey,
        clientId,
        channel: 'EMAIL' as NotificationChannel,
        status: 'UNsubscribed',
        payload: variables,
        variables,
        consentGiven: false,
        retryCount: 0,
        maxRetries: 0,
      });
      return { notification: skippedNotification, result: null, skipped: true };
    }

    // 2. Get the template
    const template = this.getTemplate(templateKey);
    if (!template) {
      const notFoundNotification = this.createNotification({
        templateId: templateKey,
        clientId,
        channel: 'EMAIL' as NotificationChannel,
        status: 'FAILED',
        payload: variables,
        variables,
        error: `Template not found: ${templateKey}`,
        consentGiven: false,
        retryCount: 0,
        maxRetries: 0,
      });
      return { notification: notFoundNotification, result: null, skipped: false };
    }

    // 3. Check channel-specific preference
    const channelAllowed = this.canClientReceive(clientId, template.channel, messageType);
    if (!channelAllowed) {
      const skippedNotification = this.createNotification({
        templateId: templateKey,
        clientId,
        channel: template.channel,
        status: 'UNsubscribed',
        payload: variables,
        variables,
        consentGiven: false,
        retryCount: 0,
        maxRetries: 0,
      });
      return { notification: skippedNotification, result: null, skipped: true };
    }

    // 4. Create the notification record
    const notification = this.createNotification({
      templateId: templateKey,
      clientId,
      channel: template.channel,
      status: 'QUEUED',
      payload: variables,
      variables,
      consentGiven:
        messageType !== 'marketing' || (messageType === 'marketing' && template.marketing),
      retryCount: 0,
      maxRetries: 0,
    });

    // 5. Get channel adapter and send
    const adapter = this.getChannelAdapter(template.channel);
    let result: ChannelSendResult | null = null;

    if (adapter) {
      // In a real implementation, we'd render the template with variables
      // and call the provider's API
      result = this.sendViaAdapter(adapter, template, variables);
    } else {
      // No adapter configured - mark as failed
      this.updateNotificationStatus(notification.id, 'FAILED', 'No channel adapter configured');
    }

    return { notification, result, skipped: false };
  }

  /** Send a notification via a channel adapter.
   *  Subclasses or implementations provide the actual provider integration.
   */
  protected sendViaAdapter(
    _adapter: ChannelAdapterConfig,
    _template: NotificationTemplate,
    _variables: TemplateVariables
  ): ChannelSendResult {
    // Default implementation - should be overridden by concrete adapters
    const now = new Date();
    return {
      messageId: `msg-${Date.now()}`,
      status: 'sent',
      sentAt: now,
    };
  }

  /** Render template with variables.
   *  Simple placeholder substitution for {{variableName}} patterns.
   *  Supports jinja2 and mustache patterns.
   */
  renderTemplate(template: NotificationTemplate, variables: TemplateVariables): string {
    let rendered = template.body;

    // Replace {{variableName}} patterns (jinja2/mustache compatible)
    const variableRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    rendered = rendered.replace(variableRegex, (match, varPath) => {
      const value = this.getVariableValue(variables, varPath);
      if (value === undefined) return match; // leave placeholder if not found
      return String(value);
    });

    return rendered;
  }

  /** Get a variable value from TemplateVariables by dot-path.
   *  Supports paths like 'client.name', 'appointment.time', 'promo.code'
   */
  private getVariableValue(variables: TemplateVariables, varPath: string): unknown {
    const parts = varPath.split('.');
    let value: unknown = variables;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as any)[part];
    }

    return value;
  }
}
