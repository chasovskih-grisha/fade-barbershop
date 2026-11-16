export interface OfflineMutation {
  id: string;
  type: 'BOOK_APPOINTMENT' | 'UPDATE_PROFILE' | 'CANCEL_APPOINTMENT';
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  actionButtons?: { id: string; title: string }[];
}

export class MobileSyncEngine {
  private queue: OfflineMutation[] = [];
  private isOnline: boolean = true;
  private pushHandlers: ((notification: PushNotificationPayload) => void)[] = [];

  constructor(initialOnlineState: boolean = true) {
    this.isOnline = initialOnlineState;
  }

  public setOnline(status: boolean): void {
    this.isOnline = status;
    if (this.isOnline) {
      this.flushQueue();
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public enqueueMutation(type: OfflineMutation['type'], payload: Record<string, any>): string {
    const id = `mut_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const mutation: OfflineMutation = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(mutation);
    if (this.isOnline) {
      this.flushQueue();
    }
    return id;
  }

  public getQueue(): OfflineMutation[] {
    return [...this.queue];
  }

  public flushQueue(): { processed: number; failed: number } {
    if (!this.isOnline) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const remainingQueue: OfflineMutation[] = [];

    for (const mutation of this.queue) {
      try {
        if (mutation.payload && mutation.payload.failSync) {
          throw new Error('Simulated network sync failure');
        }
        processed++;
      } catch (err) {
        mutation.retries++;
        if (mutation.retries < 3) {
          remainingQueue.push(mutation);
        }
        failed++;
      }
    }

    this.queue = remainingQueue;
    return { processed, failed };
  }

  public registerPushHandler(handler: (notification: PushNotificationPayload) => void): void {
    this.pushHandlers.push(handler);
  }

  public receivePushNotification(notification: PushNotificationPayload): void {
    for (const handler of this.pushHandlers) {
      handler(notification);
    }
  }
}

if (typeof describe === 'function') {
  describe('MobileSyncEngine (Offline-First & Push Notifications)', () => {
    let syncEngine: MobileSyncEngine;

    beforeEach(() => {
      syncEngine = new MobileSyncEngine(true);
    });

    test('should initialize with correct online status', () => {
      expect(syncEngine.getOnlineStatus()).toBe(true);
      const offlineEngine = new MobileSyncEngine(false);
      expect(offlineEngine.getOnlineStatus()).toBe(false);
    });

    test('should enqueue mutations when offline and flush when online', () => {
      syncEngine.setOnline(false);
      expect(syncEngine.getOnlineStatus()).toBe(false);

      const mutId1 = syncEngine.enqueueMutation('BOOK_APPOINTMENT', { serviceId: 'srv_1', barberId: 'barber_1' });
      const mutId2 = syncEngine.enqueueMutation('UPDATE_PROFILE', { name: 'John Doe' });

      const queue = syncEngine.getQueue();
      expect(queue.length).toBe(2);
      expect(queue[0].id).toBe(mutId1);
      expect(queue[1].type).toBe('UPDATE_PROFILE');

      syncEngine.setOnline(true);
      expect(syncEngine.getOnlineStatus()).toBe(true);
      expect(syncEngine.getQueue().length).toBe(0);
    });

    test('should handle retry logic and failed mutations in queue', () => {
      syncEngine.setOnline(false);

      syncEngine.enqueueMutation('BOOK_APPOINTMENT', { failSync: true });
      syncEngine.setOnline(true);

      const queue = syncEngine.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].retries).toBe(1);
    });

    test('should register and dispatch push notifications with action buttons', () => {
      const receivedNotifications: PushNotificationPayload[] = [];
      syncEngine.registerPushHandler((notification: PushNotificationPayload) => {
        receivedNotifications.push(notification);
      });

      const testNotification: PushNotificationPayload = {
        title: 'Appointment Reminder',
        body: 'Your haircut with Mike is in 1 hour.',
        data: { appointmentId: 'apt_123' },
        actionButtons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'reschedule', title: 'Reschedule' }
        ]
      };

      syncEngine.receivePushNotification(testNotification);

      expect(receivedNotifications.length).toBe(1);
      expect(receivedNotifications[0].title).toBe('Appointment Reminder');
      expect(receivedNotifications[0].actionButtons?.length).toBe(2);
      expect(receivedNotifications[0].actionButtons?.[0].id).toBe('confirm');
    });
  });
}
