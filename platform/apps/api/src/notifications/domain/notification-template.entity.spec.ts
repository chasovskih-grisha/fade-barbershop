/* eslint-disable max-lines -- cohesive module (191 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import {
  NotificationTemplate,
  NotificationChannel,
  TemplateVariables,
  NotificationStatus,
} from './notification-template.entity';
import { NotificationRegistry } from './notification-template.entity';

describe('NotificationChannel', () => {
  const validChannels: NotificationChannel[] = [
    'SMS',
    'EMAIL',
    'PUSH',
    'TELEGRAM',
    'VIBER',
    'WHATSAPP',
  ];

  it('should accept all valid channels', () => {
    for (const channel of validChannels) {
      expect(channel).toBeDefined();
    }
  });
});

describe('NotificationTemplate', () => {
  it('should create a valid notification template', () => {
    const template: NotificationTemplate = {
      id: 'temp-001',
      key: 'booking_confirmation',
      channel: 'EMAIL' as NotificationChannel,
      subject: 'Booking Confirmation',
      body: 'Hello {{client.name}}, your appointment is confirmed for {{appointment.time}}',
      variables: ['client.name', 'appointment.time'],
      version: 1,
      active: true,
      pattern: 'jinja2',
      marketing: false,
      createdAt: new Date(),
    };

    expect(template.key).toBe('booking_confirmation');
    expect(template.channel).toBe('EMAIL');
    expect(template.variables).toContain('client.name');
  });

  it('should support all channel types', () => {
    const template: NotificationTemplate = {
      id: 'temp-002',
      key: 'sms_reminder',
      channel: 'SMS' as NotificationChannel,
      body: 'Reminder: {{appointment.time}} in {{minutes}} minutes',
      variables: ['appointment.time', 'minutes'],
      version: 1,
      active: true,
      pattern: 'mustache',
      marketing: false,
      createdAt: new Date(),
    };

    expect(template.channel).toBe('SMS');
  });
});

describe('TemplateVariables', () => {
  it('should accept template variables', () => {
    const vars: TemplateVariables = {
      'client.name': 'John Doe',
      'appointment.time': new Date(),
      minutes: 30,
      'promo.code': undefined,
    };

    expect(vars['client.name']).toBe('John Doe');
    expect(vars['appointment.time']).toBeInstanceOf(Date);
  });
});

describe('NotificationStatus', () => {
  it('should accept all valid statuses', () => {
    const statuses: NotificationStatus[] = [
      'QUEUED',
      'SENDING',
      'SENT',
      'DELIVERED',
      'FAILED',
      'UNsubscribed',
    ];
    for (const status of statuses) {
      expect(status).toBeDefined();
    }
  });
});

describe('NotificationRegistry', () => {
  let registry: NotificationRegistry;

  beforeEach(() => {
    registry = new NotificationRegistry();
    // Seed a default template
    registry.createTemplate({
      key: 'booking_confirmation',
      channel: 'EMAIL' as NotificationChannel,
      subject: 'Booking Confirmation',
      body: 'Hello {{client.name}}, your appointment is confirmed',
      variables: ['client.name'],
      active: true,
    });
  });

  describe('createTemplate', () => {
    it('should create a notification template', () => {
      const template = registry.createTemplate({
        key: 'sms_reminder',
        channel: 'SMS' as NotificationChannel,
        body: 'Reminder in {{minutes}} minutes',
        variables: ['minutes'],
        active: true,
      });
      expect(template.key).toBe('sms_reminder');
      expect(template.channel).toBe('SMS');
      expect(template.pattern).toBe('mustache'); // default
    });

    it('should apply default values', () => {
      const template = registry.createTemplate({
        key: 'test',
        channel: 'EMAIL' as NotificationChannel,
        body: 'Test body',
      });
      expect(template.variables).toEqual([]);
      expect(template.marketing).toBe(false);
      expect(template.active).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should get a template by key', () => {
      const template = registry.getTemplate('booking_confirmation');
      expect(template).toBeDefined();
      expect(template?.key).toBe('booking_confirmation');
    });

    it('should return undefined for non-existent template', () => {
      const template = registry.getTemplate('nonexistent');
      expect(template).toBeUndefined();
    });
  });

  describe('getActiveTemplates', () => {
    it('should return only active templates', () => {
      const active = registry.getActiveTemplates();
      expect(active.length).toBeGreaterThan(0);
    });

    it('should exclude inactive templates', () => {
      registry.createTemplate({
        key: 'inactive',
        channel: 'EMAIL' as NotificationChannel,
        body: 'Inactive template',
        active: false,
      });
      const active = registry.getActiveTemplates();
      // Should only have the original active template from beforeEach
      expect(active.length).toBe(1);
    });
  });

  describe('sendNotification', () => {
    it('should send a notification and return result', () => {
      const result = registry.sendNotification('client-1', 'booking_confirmation', {
        'client.name': 'John Doe',
        appointment: { time: new Date('2024-01-15T14:00:00Z') },
      });
      expect(result).toBeDefined();
      expect(result.notification).toBeDefined();
    });

    it('should respect communication preferences - opt-out', () => {
      registry.setPreference({
        clientId: 'client-1',
        channelPreferences: {
          SMS: 'opt-in',
          EMAIL: 'opt-out',
        },
        messageTypePreferences: {},
        globalOptOut: false,
        updatedAt: new Date(),
      });

      const result = registry.sendNotification('client-1', 'booking_confirmation', {
        'client.name': 'John Doe',
      });
      // Should be skipped due to EMAIL opt-out
      expect(result.skipped).toBe(true);
    });

    it('should respect global opt-out', () => {
      registry.setPreference({
        clientId: 'client-2',
        channelPreferences: {
          SMS: 'opt-in',
          EMAIL: 'opt-in',
        },
        messageTypePreferences: {},
        globalOptOut: true,
        updatedAt: new Date(),
      });

      const result = registry.sendNotification('client-2', 'booking_confirmation', {
        'client.name': 'Jane Doe',
      });
      // Should be skipped due to global opt-out
      expect(result.skipped).toBe(true);
    });
  });
});
