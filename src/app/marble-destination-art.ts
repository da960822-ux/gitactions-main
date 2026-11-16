import manifest from '../../public/images/marble/destination-characters.json';
import { marbleIslandImage } from './marble-runtime-images';

export function marbleDestinationImage(name: string): string {
  return manifest.assets.find(asset => asset.name === name || asset.slug === name)?.path ?? marbleIslandImage;
}

export function marbleSpecialDestinationImage(kind: string): string | undefined {
  return kind === 'festival-site' ? marbleDestinationImage(kind) : kind === 'island' ? marbleDestinationImage('castaway-island') : undefined;
}
