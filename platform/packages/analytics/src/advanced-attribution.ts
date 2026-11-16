export interface Touchpoint {
  channel: 'organic' | 'paid_search' | 'social' | 'direct' | 'referral';
  campaign?: string;
  timestamp: number;
}

export interface AttributionResult {
  userId: string;
  conversionValue: number;
  touchpoints: Touchpoint[];
  attributedChannels: { channel: string; share: number }[];
}

export class AdvancedAttributionEngine {
  // Multi-Touch Attribution (MTA) using Time Decay or Linear Model
  calculateAttribution(userId: string, conversionValue: number, touchpoints: Touchpoint[], model: 'linear' | 'time-decay' = 'linear'): AttributionResult {
    if (touchpoints.length === 0) {
      return { userId, conversionValue, touchpoints, attributedChannels: [] };
    }

    const sorted = [...touchpoints].sort((a, b) => a.timestamp - b.timestamp);
    const shares: { [channel: string]: number } = {};

    if (model === 'linear') {
      const weight = 1 / sorted.length;
      sorted.forEach(tp => {
        shares[tp.channel] = (shares[tp.channel] || 0) + weight;
      });
    } else if (model === 'time-decay') {
      let totalWeight = 0;
      const rawWeights = sorted.map((tp, idx) => {
        const w = Math.pow(2, idx / sorted.length);
        totalWeight += w;
        return { channel: tp.channel, w };
      });

      rawWeights.forEach(rw => {
        shares[rw.channel] = (shares[rw.channel] || 0) + (rw.w / totalWeight);
      });
    }

    const attributedChannels = Object.entries(shares).map(([channel, share]) => ({
      channel,
      share: Number(share.toFixed(4))
    }));

    return {
      userId,
      conversionValue,
      touchpoints: sorted,
      attributedChannels
    };
  }
}
