/** Minimal local typings for the Web Push subscription payload used by the BFF. */
declare module 'web-push' {
  export interface SubscriptionKeys {
    p256dh: string;
    auth: string;
  }

  /** Browser push subscription as delivered by the Web Push API. */
  export interface Subscription {
    endpoint: string;
    keys: SubscriptionKeys;
  }
}
