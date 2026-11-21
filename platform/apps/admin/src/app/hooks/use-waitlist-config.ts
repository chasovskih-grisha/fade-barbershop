/** T-180: Waitlist configuration hook for admin dashboard */
import { useEffect, useState } from 'react';

/** Waitlist configuration interface */
export interface WaitlistConfiguration {
  maxHoldTimeMinutes: number;
  maxMissedSlotsPause: number;
  minSlotHoldDurationMinutes: number;
  enableCascade: boolean;
  autoPromotionEnabled: boolean;
  priorityScoringEnabled: boolean;
}

/** Waitlist summary metrics interface */
export interface WaitlistSummary {
  totalActiveClients: number;
  totalWaiting: number;
  averageWaitTime: number;
  topServices: Array<{ serviceId: string; count: number }>;
  cascadeActivationRate: number;
  promotionRate: number;
}

/** Fetch waitlist configuration from API */
export function useWaitlistConfig(): {
  data: WaitlistConfiguration | null;
  isLoading: boolean;
  refresh: () => void;
} {
  const [data, setData] = useState<WaitlistConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      setIsLoading(true);
      try {
        // In a real implementation, this would call the API
        // const response = await fetch('/api/waitlist/config', {
        //   credentials: 'include',
        // });
        // const result = await response.json();
        // setData(result.configuration);
        // Mock data for now
        setData({
          maxHoldTimeMinutes: 15,
          maxMissedSlotsPause: 3,
          minSlotHoldDurationMinutes: 5,
          enableCascade: true,
          autoPromotionEnabled: true,
          priorityScoringEnabled: true,
        });
      } catch (error) {
        console.error('Failed to fetch waitlist config:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { data, isLoading, refresh: () => {} };
}

/** Fetch waitlist summary from API */
export function useWaitlistSummary(): {
  data: WaitlistSummary | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<WaitlistSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true);
      try {
        // In a real implementation, this would call the API
        // const response = await fetch('/api/waitlist/summary', {
        //   credentials: 'include',
        // });
        // const result = await response.json();
        // setData(result.summary);
        // Mock data for now
        setData({
          totalActiveClients: 24,
          totalWaiting: 24,
          averageWaitTime: 12,
          topServices: [],
          cascadeActivationRate: 65.5,
          promotionRate: 42.3,
        });
      } catch (error) {
        console.error('Failed to fetch waitlist summary:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, []);

  return { data, isLoading, refetch: () => {} };
}
