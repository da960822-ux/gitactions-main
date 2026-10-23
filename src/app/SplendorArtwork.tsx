import { useId } from 'react';

// Scanned rules text competes with the engine values; show only the illustration.
export function SplendorArtwork({ src, className = '', label }: { src: string; className?: string; label?: string }) {
  const clipId = `sp-art-${useId().replace(/:/g, '')}`;
  const card = /\/splendor\/cards\/\d+\.jpg$/.test(src);
  const printedNoble = /\/splendor\/nobles\/\d+\.jpg$/.test(src);
  const [x, y, width, height] = card ? [85, 90, 165, 260] : printedNoble ? [75, 0, 175, 250] : [0, 0, 100, 100];
  return <svg className={`sp-artwork ${className}`} viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
    data-artwork-only={card ? 'card' : printedNoble ? 'noble' : 'portrait'}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
    <image href={src} width={card || printedNoble ? 250 : 100} height={card ? 350 : printedNoble ? 250 : 100} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipId})`}/>
  </svg>;
}
