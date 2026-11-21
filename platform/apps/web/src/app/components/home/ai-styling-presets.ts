import type { HairProfile, Recommendation } from './ai-styling-types';
import { OVAL_PRESETS, SQUARE_PRESETS, ROUND_PRESETS } from './ai-styling-preset-data';
import { HEART_PRESETS, DIAMOND_PRESETS } from './ai-styling-preset-data-more';

export type { HairProfile, Recommendation } from './ai-styling-types';

export const STYLE_PRESETS: Record<HairProfile['faceShape'], Recommendation[]> = {
  oval: OVAL_PRESETS,
  square: SQUARE_PRESETS,
  round: ROUND_PRESETS,
  heart: HEART_PRESETS,
  diamond: DIAMOND_PRESETS,
};
