import manifest from '../../public/images/marble/runtime-images.json';

export function marbleRuntimeImage(sourceName: string): string {
  const asset = manifest.assets.find(asset => asset.source.endsWith(`/${sourceName}`));
  if (!asset) throw new Error(`Missing approved Marble runtime image: ${sourceName}`);
  return asset.path;
}
export const marbleIslandImage = marbleRuntimeImage('tropical-island-v1.png');
