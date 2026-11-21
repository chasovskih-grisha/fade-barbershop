import type { AttributionModel, Touchpoint } from './attribution';

function addWeight(weights: Record<string, number>, tp: Touchpoint, share: number): void {
  const key = `${tp.source}/${tp.medium}`;
  weights[key] = (weights[key] || 0) + share;
}

function applyTimeDecay(weights: Record<string, number>, touchpoints: Touchpoint[]): void {
  let totalWeight = 0;
  const decayWeights = touchpoints.map((tp, idx) => {
    const w = Math.pow(2, idx / 2 - touchpoints.length / 2);
    totalWeight += w;
    return { tp, w };
  });
  for (const { tp, w } of decayWeights) addWeight(weights, tp, w / totalWeight);
}

/** Distributes credit across the journey according to the selected model. */
export function weighTouchpoints(
  touchpoints: Touchpoint[],
  model: AttributionModel
): Record<string, number> {
  const weights: Record<string, number> = {};
  const total = touchpoints.length;
  if (total === 0) return weights;

  if (model === 'first_touch' || model === 'last_touch') {
    const chosen = model === 'first_touch' ? touchpoints[0] : touchpoints[total - 1];
    if (chosen) weights[`${chosen.source}/${chosen.medium}`] = 1.0;
    return weights;
  }

  if (model === 'linear') {
    const share = 1.0 / total;
    for (const tp of touchpoints) addWeight(weights, tp, share);
    return weights;
  }

  applyTimeDecay(weights, touchpoints);
  return weights;
}
