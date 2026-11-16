import { useId } from 'react';
import boardArt from '../../public/images/splendor/board-map.json';

const boardSources: Record<string, string> = boardArt;
export const splendorBoardArtSrc = (src: string) => Object.hasOwn(boardSources, src) ? boardSources[src] : src;

// Scanned rules text competes with the engine values; show only the illustration.
export function SplendorArtwork({ src, className = '', label, fullSize = false }: { src: string; className?: string; label?: string; fullSize?: boolean }) {
  const clipId = `sp-art-${useId().replace(/:/g, '')}`;
  const card = /\/splendor\/cards\/\d+\.jpg$/.test(src);
  const printedNoble = /\/splendor\/nobles\/\d+\.jpg$/.test(src);
  const customCard = /\/splendor\/custom-v2\/t[23]-\d+\.webp$/.test(src);
  const customNoble = /\/splendor\/custom-v2\/n\d+\.webp$/.test(src);
  const [x, y, width, height] = card ? [85, 90, 165, 260] : printedNoble ? [75, 0, 175, 250] : [0, 0, 100, customCard ? 150 : 100];
  return <svg className={`sp-artwork ${className}`} viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio={customCard ? 'xMidYMin slice' : 'xMidYMid meet'}
    data-artwork-only={card || customCard ? 'card' : printedNoble || customNoble ? 'noble' : 'portrait'}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
    <image href={fullSize ? src : splendorBoardArtSrc(src)} width={card || printedNoble ? 250 : 100} height={card ? 350 : printedNoble ? 250 : customCard ? 150 : 100} preserveAspectRatio={customNoble ? 'xMidYMin slice' : 'xMidYMid meet'} clipPath={`url(#${clipId})`}/>
  </svg>;
}
