export type StaticAsset = string | { src: string };

// Next static imports are `{ src, width, height }`. Jest and some loaders
// still hand back a string. `<img src>` needs the URL either way.
export function assetUrl(asset: StaticAsset): string {
  return typeof asset === 'string' ? asset : asset.src;
}
