import { uiIcons } from './ui';
import { channelIcons } from './channel';

// Один набір іконок (T-4506): лінійні + канальні. Ключі — єдине джерело імен.
export const iconPaths = { ...uiIcons, ...channelIcons } as const;

export type IconName = keyof typeof iconPaths;
